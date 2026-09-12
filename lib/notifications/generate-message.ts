// 알림 메시지 생성 로직 — 프롬프트(message-prompts.ts)를 LLM에 실제로 태워 메시지 본문을 만든다.
// 서버 전용(LLM_API_KEY 필요) — app/api/diagnose/route.ts와 동일한 방침으로 클라이언트 컴포넌트에서
// import 금지.
//
// 주의: 아직 실제 발송(스케줄러/cron)이나 카카오 발송 API 연동은 없다. 여기서 만드는 것은
// "지금 이 컨텍스트로 메시지를 생성하면 이런 텍스트가 나온다"는 생성 함수까지이며,
// 언제 호출할지(스케줄링)와 만들어진 텍스트를 카카오로 보내는 것은 이후 별도로 구현한다.

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  buildExpiryReminderPrompt,
  buildPersonaNotificationPrompt,
  type ExpiryReminderContext,
  type PersonaNotificationContext,
} from "./message-prompts";

const MODEL_ID = process.env.LLM_MODEL || "claude-sonnet-5";

// app/api/diagnose/route.ts와 동일하게, 엘리스 mlapi 중계 서버(OpenAI 호환 스펙)를 거쳐 호출한다.
const llmProvider = createOpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

/** 페르소나별 정기 알림 메시지를 생성한다 (rules.ts의 PERSONA_NOTIFICATION_RULES 대상). */
export async function generatePersonaNotificationMessage(ctx: PersonaNotificationContext): Promise<string> {
  const { text } = await generateText({
    model: llmProvider(MODEL_ID),
    prompt: buildPersonaNotificationPrompt(ctx),
    temperature: 0.9,
  });
  return text.trim();
}

/** 마감임박(D-7/D-3/D-1) 알림 메시지를 생성한다. 페르소나 무관 공통 로직. */
export async function generateExpiryReminderMessage(ctx: ExpiryReminderContext): Promise<string> {
  const { text } = await generateText({
    model: llmProvider(MODEL_ID),
    prompt: buildExpiryReminderPrompt(ctx),
    temperature: 0.8,
  });
  return text.trim();
}
