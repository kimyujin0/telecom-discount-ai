import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { INITIAL_GREETING } from "@/lib/chat/constants";
import { parseAssistantTurn } from "@/lib/chat/parse-diagnosis-result";
import { buildDiagnosisSystemPrompt } from "@/lib/chat/system-prompt";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MODEL_ID = process.env.LLM_MODEL || "claude-sonnet-5";

// Claude를 직접 호출하지 않고, 엘리스 mlapi 중계 서버(OpenAI 호환 스펙: /v1/chat/completions)를
// 거쳐서 호출한다. LLM_BASE_URL이 비어 있으면 공식 OpenAI API를 바라보게 되므로 반드시 설정해야 한다.
const llmProvider = createOpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});
const MATCHED_BENEFITS_LIMIT = 3;
// 스트리밍 도중 이 문자열이 등장하면(=```diagnosis-result 코드 블록 시작) 그 뒤로는
// 클라이언트에 원문을 흘려보내지 않는다. 시스템 프롬프트에서 코드 블록 용도로만 백틱을 쓰도록
// 지시했으므로, 백틱 3개 등장 = 진단 결과 블록 시작으로 취급해도 안전하다.
const FENCE_SENTINEL = "```";

interface StoredMessage {
  role: string;
  content: string;
}

interface DiagnoseRequestBody {
  sessionId?: string | null;
  message?: string;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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

    const { error: greetingError } = await supabase.from("diagnosis_messages").insert({
      session_id: sessionId,
      turn_index: 0,
      role: "assistant",
      content: INITIAL_GREETING,
    });
    if (greetingError) console.error("[diagnose] failed to store greeting", greetingError);

    dbMessages = [{ role: "assistant", content: INITIAL_GREETING }];
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
  const userTurnCount = dbMessages.filter((m) => m.role === "user").length + 1;

  const { error: insertUserError } = await supabase.from("diagnosis_messages").insert({
    session_id: sessionId,
    turn_index: nextTurnIndex,
    role: "user",
    content: userMessage,
  });
  if (insertUserError) console.error("[diagnose] failed to store user message", insertUserError);

  const history = [...dbMessages, { role: "user" as const, content: userMessage }];

  // streamText는 provider 호출이 실패해도 textStream 자체는 그냥 빈 스트림으로 끝날 수 있어서
  // (for-await가 throw하지 않음), onError로 실패를 별도로 붙잡아둔다.
  let modelCallError: unknown = null;

  const result = streamText({
    model: llmProvider(MODEL_ID),
    system: buildDiagnosisSystemPrompt(userTurnCount),
    messages: history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    temperature: 0.8,
    onError: ({ error }) => {
      modelCallError = error;
    },
  });

  const encoder = new TextEncoder();
  const finalSessionId = sessionId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      let sentLength = 0;
      let fenceIndex = -1;

      try {
        for await (const chunk of result.textStream) {
          fullText += chunk;

          if (fenceIndex === -1) {
            const idx = fullText.indexOf(FENCE_SENTINEL);
            if (idx === -1) {
              const toSend = fullText.slice(sentLength);
              if (toSend) {
                controller.enqueue(encoder.encode(toSend));
                sentLength = fullText.length;
              }
            } else {
              fenceIndex = idx;
              const toSend = fullText.slice(sentLength, fenceIndex).trimEnd();
              if (toSend) controller.enqueue(encoder.encode(toSend));
              sentLength = fullText.length;
            }
          }
        }
      } catch (streamError) {
        console.error("[diagnose] streaming error", streamError);
        controller.enqueue(encoder.encode("죄송해요, 진단 중 오류가 발생했어요. 다시 시도해주세요."));
        controller.close();
        return;
      }

      if (modelCallError) {
        console.error("[diagnose] model call failed", modelCallError);
        controller.enqueue(encoder.encode("죄송해요, AI 응답을 받아오지 못했어요. 잠시 후 다시 시도해주세요."));
        controller.close();
        return;
      }

      const { visibleText, diagnosis } = parseAssistantTurn(fullText);
      const assistantTurnIndex = nextTurnIndex + 1;

      if (!diagnosis) {
        const { error } = await supabase.from("diagnosis_messages").insert({
          session_id: finalSessionId,
          turn_index: assistantTurnIndex,
          role: "assistant",
          content: visibleText,
        });
        if (error) console.error("[diagnose] failed to store assistant message", error);
        controller.close();
        return;
      }

      const closingText = visibleText || "답변 감사해요! 진단이 완료됐어요 🎉 아래에서 결과를 확인해보세요.";

      const { error: assistantMsgError } = await supabase.from("diagnosis_messages").insert({
        session_id: finalSessionId,
        turn_index: assistantTurnIndex,
        role: "assistant",
        content: closingText,
      });
      if (assistantMsgError) console.error("[diagnose] failed to store closing message", assistantMsgError);

      const { data: personaRow, error: personaError } = await supabase
        .from("personas")
        .select("id, name")
        .eq("key", diagnosis.personaKey)
        .maybeSingle();

      if (personaError || !personaRow) {
        console.error("[diagnose] unknown persona key from model", diagnosis.personaKey, personaError);
        controller.close();
        return;
      }

      const { data: resultRow, error: resultError } = await supabase
        .from("diagnosis_results")
        .insert({
          session_id: finalSessionId,
          persona_id: personaRow.id,
          persona_description: diagnosis.description,
          model: MODEL_ID,
          raw_model_output: { fullText },
        })
        .select("id")
        .single();

      if (resultError || !resultRow) {
        console.error("[diagnose] failed to store diagnosis result", resultError);
        controller.close();
        return;
      }

      const { data: matches, error: matchError } = await supabase
        .from("persona_benefits")
        .select("weight, benefits!inner(id, provider, title, estimated_monthly_saving, is_active)")
        .eq("persona_id", personaRow.id)
        .eq("benefits.is_active", true)
        .order("weight", { ascending: false })
        .limit(MATCHED_BENEFITS_LIMIT);

      if (matchError) console.error("[diagnose] failed to load matched benefits", matchError);

      type BenefitRow = { id: string; provider: string; title: string; estimated_monthly_saving: number };
      const matchedBenefits: BenefitRow[] = (matches ?? [])
        .map((m) => m.benefits as unknown as BenefitRow)
        .filter((b): b is BenefitRow => Boolean(b));

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

      const totalMonthlySaving = matchedBenefits.reduce((sum, b) => sum + b.estimated_monthly_saving, 0);

      const marker = {
        done: true,
        personaKey: diagnosis.personaKey,
        personaName: personaRow.name,
        description: diagnosis.description,
        benefits: matchedBenefits.map((b) => ({
          provider: b.provider,
          title: b.title,
          monthlySaving: b.estimated_monthly_saving,
        })),
        totalMonthlySaving,
        totalYearlySaving: totalMonthlySaving * 12,
      };

      controller.enqueue(encoder.encode(`\n\n<<<DIAGNOSIS_RESULT_JSON>>>${JSON.stringify(marker)}`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": finalSessionId,
      "Cache-Control": "no-store",
    },
  });
}
