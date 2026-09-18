import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeTierInput, TIER_UNKNOWN } from "@/lib/carrierTiers";
import { diagnosisExtractionSchema, reasonGenerationSchema } from "@/lib/chat/diagnosis-schema";
import {
  buildSlotQuestion,
  CARRIER_CONFIRM_MARKER,
  firstMissingCoreSlot,
  isCoreSlotsFilled,
  isFixedQuestionSlot,
  TIER_QUESTION_MARKER,
  type DiagnosisSlots,
} from "@/lib/chat/slots";
import {
  buildReasonGenerationPrompt,
  buildSlotExtractionSystemPrompt,
  MAX_FOLLOWUPS,
  type UserContext,
} from "@/lib/chat/system-prompt";
import { matchBenefitsForSlots, type MatchedBenefitRow } from "@/lib/diagnosisBenefitMatch";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MODEL_ID = process.env.LLM_MODEL || "claude-sonnet-5";

// Claude를 직접 호출하지 않고, 엘리스 mlapi 중계 서버(OpenAI 호환 스펙: /v1/chat/completions)를
// 거쳐서 호출한다. LLM_BASE_URL이 비어 있으면 공식 OpenAI API를 바라보게 되므로 반드시 설정해야 한다.
const llmProvider = createOpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

interface StoredMessage {
  role: string;
  content: string;
}

interface DiagnoseRequestBody {
  sessionId?: string | null;
  message?: string;
}

interface FollowUpResponseBody {
  sessionId: string;
  done: false;
  question: string;
  quickReplies: string[];
}

interface ResultBenefit {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  category: string | null;
  estimatedMonthlySaving: number;
  reason: string;
}

interface ResultResponseBody {
  sessionId: string;
  done: true;
  personaTagline: string;
  totalMonthlySaving: number;
  totalYearlySaving: number;
  benefits: ResultBenefit[];
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** LLM이 reason을 빠뜨렸을 때를 대비한 안전망 — 슬롯 값을 반영하되 매번 고정 문구는 아니게 조합한다. */
function fallbackReason(benefit: MatchedBenefitRow, slots: DiagnosisSlots): string {
  const bits: string[] = [];
  if (slots.carrier) bits.push(`${slots.carrier} 이용`);
  if (slots.tier && slots.tier !== TIER_UNKNOWN) bits.push(`${slots.tier} 등급`);
  if (slots.dataUsage) bits.push(`데이터 ${slots.dataUsage} 사용`);
  if (slots.ottUsage === "있음") bits.push("OTT 이용 중");
  if (slots.overseasUsage && slots.overseasUsage !== "거의없음") bits.push(`해외 이용 ${slots.overseasUsage}`);
  const basis = bits.length > 0 ? bits.join(", ") : "평소 소비 패턴";
  return `${basis} 기준으로 "${benefit.title}" 혜택이 도움이 될 것 같아요.`;
}

export async function POST(request: Request) {
  let body: DiagnoseRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonError("잘못된 요청 형식이에요.", 400);
  }

  const userMessage = body.message?.trim();
  if (!userMessage) {
    return jsonError("메시지를 입력해주세요.", 400);
  }

  // 로그인 사용자라면 회원가입 때 등록한 통신사를 대화에 활용한다 (확인만 받고 넘어가기 위함).
  // 비로그인 사용자도 그대로 진단할 수 있으므로 여기서 인증을 강제하지 않는다.
  const authUser = await getCurrentUser();
  const userContext: UserContext = {
    nickname: authUser?.nickname ?? null,
    profileCarrier: authUser?.carrier ?? null,
  };

  const supabase = getSupabaseServerClient();
  let sessionId = body.sessionId ?? null;
  let dbMessages: StoredMessage[];

  if (!sessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("diagnosis_sessions")
      .insert({
        // 로그인 사용자는 user_id로 묶어 마이페이지에서 진단 이력을 찾을 수 있게 한다.
        // diagnosis_sessions_owner_check 제약 때문에 둘 중 하나는 반드시 있어야 한다.
        user_id: authUser?.id ?? null,
        anonymous_key: authUser ? null : crypto.randomUUID(),
        status: "in_progress",
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("[diagnose] failed to create session", sessionError);
      return jsonError("세션을 시작하지 못했어요. 잠시 후 다시 시도해주세요.", 500);
    }

    sessionId = session.id as string;
    dbMessages = [];
  } else {
    const { data: existing, error: historyError } = await supabase
      .from("diagnosis_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("turn_index", { ascending: true });

    if (historyError) {
      console.error("[diagnose] failed to load history", historyError);
      return jsonError("대화 이력을 불러오지 못했어요.", 500);
    }
    dbMessages = existing ?? [];
  }

  const nextTurnIndex = dbMessages.length;
  const followUpsSoFar = dbMessages.filter((m) => m.role === "assistant").length;

  // 같은 질문을 되묻지 않기 위해, 통신사 확인/등급 질문을 이미 했는지 대화 이력에서 확인한다.
  const assistantMessages = dbMessages.filter((m) => m.role === "assistant");
  const carrierConfirmAsked = assistantMessages.some((m) => m.content.includes(CARRIER_CONFIRM_MARKER));
  const tierAsked = assistantMessages.some((m) => m.content.includes(TIER_QUESTION_MARKER));

  const { error: insertUserError } = await supabase.from("diagnosis_messages").insert({
    session_id: sessionId,
    turn_index: nextTurnIndex,
    role: "user",
    content: userMessage,
  });
  if (insertUserError) console.error("[diagnose] failed to store user message", insertUserError);

  const history = [...dbMessages, { role: "user" as const, content: userMessage }];
  const finalSessionId = sessionId;

  // 1단계: 대화 전체에서 슬롯 + 페르소나(내부용) 구조화 추출
  let extraction;
  try {
    const result = await generateObject({
      model: llmProvider.chat(MODEL_ID),
      schema: diagnosisExtractionSchema,
      system: buildSlotExtractionSystemPrompt(userContext),
      messages: history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      temperature: 0.1,
    });
    extraction = result.object;
  } catch (error) {
    console.error("[diagnose] slot extraction failed", error);
    return jsonError("죄송해요, AI 분석 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.", 500);
  }

  const carrier = extraction.slots.carrier ?? null;
  // 등급은 자유 입력이라 통신사 등급 체계(lib/carrierTiers.ts)에 맞춰 정규화한다.
  let tier = normalizeTierInput(carrier, extraction.slots.tier);
  // 이미 등급을 물었는데도 해석 가능한 답이 안 나왔다면 "모름"으로 두고 넘어간다 (무한 되묻기 방지).
  if (tier === null && tierAsked) tier = TIER_UNKNOWN;

  const slots: DiagnosisSlots = {
    carrier,
    tier,
    dataUsage: extraction.slots.dataUsage,
    ottUsage: extraction.slots.ottUsage,
    ottServices: extraction.slots.ottServices,
    overseasUsage: extraction.slots.overseasUsage,
    interestCategories: extraction.slots.interestCategories as DiagnosisSlots["interestCategories"],
  };

  // 확인된 통신사/등급은 세션에 남겨 이후 조회(UC-02 매칭 근거, 마이페이지 등)에서 다시 쓸 수 있게 한다.
  if (slots.carrier || slots.tier) {
    const { error: sessionUpdateError } = await supabase
      .from("diagnosis_sessions")
      .update({ carrier: slots.carrier, tier: slots.tier })
      .eq("id", finalSessionId);
    if (sessionUpdateError) console.error("[diagnose] failed to store carrier/tier", sessionUpdateError);
  }

  const coreFilled = isCoreSlotsFilled(slots);

  if (!coreFilled && followUpsSoFar < MAX_FOLLOWUPS) {
    const missingSlot = firstMissingCoreSlot(slots) ?? "dataUsage";
    const fallback = buildSlotQuestion(missingSlot, {
      carrier: slots.carrier,
      profileCarrier: userContext.profileCarrier,
      nickname: userContext.nickname,
      carrierConfirmAsked,
    });

    // 통신사/등급은 표기가 정확해야 해서 서버 문구를 그대로 쓰고, 나머지는 LLM이 만든 문구를 우선한다.
    const modelFollowUp =
      !isFixedQuestionSlot(missingSlot) &&
      extraction.followUpQuestion &&
      extraction.followUpQuestion.targetSlot === missingSlot
        ? extraction.followUpQuestion
        : null;
    const question = modelFollowUp?.question ?? fallback.question;
    const quickReplies = modelFollowUp?.quickReplies ?? fallback.quickReplies;

    const { error: assistantMsgError } = await supabase.from("diagnosis_messages").insert({
      session_id: finalSessionId,
      turn_index: nextTurnIndex + 1,
      role: "assistant",
      content: question,
    });
    if (assistantMsgError) console.error("[diagnose] failed to store follow-up question", assistantMsgError);

    const responseBody: FollowUpResponseBody = { sessionId: finalSessionId, done: false, question, quickReplies };
    return NextResponse.json(responseBody, { headers: { "X-Session-Id": finalSessionId } });
  }

  // 2단계: 슬롯이 채워졌거나(또는 후속 질문 한도 도달) — 페르소나 저장 + 혜택 매칭으로 진행
  const { data: personaDbRow, error: personaError } = await supabase
    .from("personas")
    .select("id")
    .eq("key", extraction.personaKey)
    .maybeSingle();

  if (personaError || !personaDbRow) {
    console.error("[diagnose] unknown persona key from model", extraction.personaKey, personaError);
    return jsonError("진단 결과를 저장하지 못했어요. 잠시 후 다시 시도해주세요.", 500);
  }

  const matchedBenefits = await matchBenefitsForSlots(supabase, slots);
  const totalMonthlySaving = matchedBenefits.reduce((sum, b) => sum + b.estimated_monthly_saving, 0);

  // 3단계: 매칭된 혜택 각각에 대한 추천 이유를, 슬롯 값을 근거로 LLM이 생성 (고정 문구 금지)
  const reasonById = new Map<string, string>();
  if (matchedBenefits.length > 0) {
    try {
      const reasonResult = await generateObject({
        model: llmProvider.chat(MODEL_ID),
        schema: reasonGenerationSchema,
        system: buildReasonGenerationPrompt(slots, matchedBenefits),
        messages: [{ role: "user", content: "위 내용을 바탕으로 reasons 배열을 작성해주세요." }],
        temperature: 0.7,
      });
      for (const r of reasonResult.object.reasons) {
        reasonById.set(r.benefitId, r.reason);
      }
    } catch (error) {
      console.error("[diagnose] reason generation failed, falling back", error);
    }
  }

  const resultBenefits: ResultBenefit[] = matchedBenefits.map((b) => ({
    id: b.id,
    provider: b.provider,
    carrier: b.carrier,
    title: b.title,
    category: b.category ?? b.persona_category,
    estimatedMonthlySaving: b.estimated_monthly_saving,
    reason: reasonById.get(b.id) ?? fallbackReason(b, slots),
  }));

  const { data: resultRow, error: resultError } = await supabase
    .from("diagnosis_results")
    .insert({
      session_id: finalSessionId,
      persona_id: personaDbRow.id,
      persona_description: extraction.personaDescription,
      model: MODEL_ID,
      raw_model_output: { extraction, slots, matchedBenefitIds: matchedBenefits.map((b) => b.id) },
    })
    .select("id")
    .single();

  if (resultError || !resultRow) {
    console.error("[diagnose] failed to store diagnosis result", resultError);
    return jsonError("진단 결과를 저장하지 못했어요. 잠시 후 다시 시도해주세요.", 500);
  }

  if (matchedBenefits.length > 0) {
    const { error: snapshotError } = await supabase.from("diagnosis_result_benefits").insert(
      matchedBenefits.map((benefit, index) => ({
        diagnosis_result_id: resultRow.id,
        benefit_id: benefit.id,
        rank: index + 1,
        estimated_monthly_saving: benefit.estimated_monthly_saving,
        // resultBenefits는 matchedBenefits와 같은 순서로 map한 배열이라 인덱스가 그대로 대응한다.
        reason: resultBenefits[index]?.reason ?? null,
      })),
    );
    if (snapshotError) console.error("[diagnose] failed to store benefit snapshot", snapshotError);
  }

  await supabase
    .from("diagnosis_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", finalSessionId);

  const responseBody: ResultResponseBody = {
    sessionId: finalSessionId,
    done: true,
    personaTagline: extraction.personaTagline,
    totalMonthlySaving,
    totalYearlySaving: totalMonthlySaving * 12,
    benefits: resultBenefits,
  };

  return NextResponse.json(responseBody, { headers: { "X-Session-Id": finalSessionId } });
}
