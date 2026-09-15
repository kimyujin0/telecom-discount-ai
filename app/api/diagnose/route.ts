import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { diagnosisExtractionSchema, reasonGenerationSchema } from "@/lib/chat/diagnosis-schema";
import {
  DEFAULT_SLOT_QUESTIONS,
  firstMissingCoreSlot,
  isCoreSlotsFilled,
  type DiagnosisSlots,
} from "@/lib/chat/slots";
import { buildReasonGenerationPrompt, buildSlotExtractionSystemPrompt, MAX_FOLLOWUPS } from "@/lib/chat/system-prompt";
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

  const supabase = getSupabaseServerClient();
  let sessionId = body.sessionId ?? null;
  let dbMessages: StoredMessage[];

  if (!sessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("diagnosis_sessions")
      .insert({ anonymous_key: crypto.randomUUID(), status: "in_progress" })
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
      system: buildSlotExtractionSystemPrompt(),
      messages: history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      temperature: 0.1,
    });
    extraction = result.object;
  } catch (error) {
    console.error("[diagnose] slot extraction failed", error);
    return jsonError("죄송해요, AI 분석 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.", 500);
  }

  const slots: DiagnosisSlots = {
    dataUsage: extraction.slots.dataUsage,
    ottUsage: extraction.slots.ottUsage,
    ottServices: extraction.slots.ottServices,
    overseasUsage: extraction.slots.overseasUsage,
    interestCategories: extraction.slots.interestCategories as DiagnosisSlots["interestCategories"],
  };

  const coreFilled = isCoreSlotsFilled(slots);

  if (!coreFilled && followUpsSoFar < MAX_FOLLOWUPS) {
    const missingSlot = firstMissingCoreSlot(slots) ?? "dataUsage";
    const modelFollowUp =
      extraction.followUpQuestion && extraction.followUpQuestion.targetSlot === missingSlot
        ? extraction.followUpQuestion
        : null;
    const fallback = DEFAULT_SLOT_QUESTIONS[missingSlot];
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
    totalMonthlySaving,
    totalYearlySaving: totalMonthlySaving * 12,
    benefits: resultBenefits,
  };

  return NextResponse.json(responseBody, { headers: { "X-Session-Id": finalSessionId } });
}
