// 알림 메시지 프롬프트 템플릿.
// CLAUDE.md의 "페르소나 설명은 고정 템플릿이 아니라 매번 LLM이 새로 생성" 원칙을
// 알림 메시지에도 동일하게 적용한다 — 여기서는 프롬프트만 만들고, 실제 LLM 호출은
// generate-message.ts가 담당한다.

import type { CarrierKey } from "@/lib/carriers";
import { getPersonaByKey, type PersonaKey } from "@/lib/chat/personas";
import type { ExpiryReminderDay } from "./rules";

export interface NotificationBenefit {
  provider: string;
  title: string;
  monthlySaving: number;
}

export interface PersonaNotificationContext {
  personaKey: PersonaKey;
  carrier: CarrierKey;
  /** 이번 발송이 어떤 규칙(slot)에 해당하는지 — rules.ts의 NotificationSchedule.summary 값 */
  occasionSummary: string;
  /** 메시지 생성 프롬프트의 톤 힌트 — rules.ts의 PersonaNotificationRule.toneHint */
  toneHint: string;
  benefits: NotificationBenefit[];
  totalMonthlySaving: number;
}

function formatBenefitLines(benefits: NotificationBenefit[]): string {
  return benefits
    .map((b) => `- [${b.provider}] ${b.title} (월 ${b.monthlySaving.toLocaleString()}원 절감)`)
    .join("\n");
}

const COMMON_WRITING_RULES = `
# 작성 규칙
- 카카오 알림톡 특성에 맞게 짧고 명확하게 작성하세요 (공백 포함 120자 내외 권장).
- 아래 정보에 없는 혜택이나 숫자를 지어내지 말고, 주어진 내용만 반영하세요.
- 이모지는 1~2개 이내로 절제해서 사용하세요.
- 마지막에 앱에서 확인하도록 자연스럽게 유도하는 문장을 한 줄 포함하세요.
- 절대 고정 템플릿 문구를 그대로 반복하지 말고, 매번 표현을 새로 바꿔서 작성하세요.
- 결과에는 발송할 메시지 본문만 출력하고, 설명이나 따옴표를 덧붙이지 마세요.`.trim();

/**
 * 페르소나별 정기 알림(rules.ts의 PERSONA_NOTIFICATION_RULES) 메시지 생성 프롬프트.
 */
export function buildPersonaNotificationPrompt(ctx: PersonaNotificationContext): string {
  const persona = getPersonaByKey(ctx.personaKey);
  const personaName = persona?.name ?? ctx.personaKey;
  const benefitLines = formatBenefitLines(ctx.benefits);

  return `당신은 통신사 결합 혜택 추천 서비스 "티모산"의 카카오 알림톡 문구를 작성하는 카피라이터입니다.
아래 사용자는 이전에 AI 진단을 통해 "${personaName}" 페르소나로 분류되었고, 이번에 정기 알림을 받을 대상입니다.

# 이번 발송 상황
- 발송 타이밍: ${ctx.occasionSummary}
- 톤 힌트: ${ctx.toneHint}
- 이용 통신사: ${ctx.carrier}
- 추천 혜택 목록:
${benefitLines || "- (이번에 새로 강조할 혜택 없음 — 기존 절감액 요약 위주로 작성)"}
- 예상 월 절감액 합계: ${ctx.totalMonthlySaving.toLocaleString()}원

발송 타이밍과 톤 힌트를 참고해 "${personaName}"에게 자연스럽게 다가가는 인사/도입부로 시작하고,
"티끌모아 태산" 컨셉으로 절감액을 강조하되 표현은 매번 새롭게 바꾸세요.

${COMMON_WRITING_RULES}`;
}

export interface ExpiryReminderContext {
  daysRemaining: ExpiryReminderDay;
  benefit: {
    provider: string;
    title: string;
    monthlySaving: number;
    validTo: string;
  };
}

/**
 * 마감임박 알림(D-7/D-3/D-1, rules.ts의 matchExpiryReminderDay) 메시지 생성 프롬프트.
 * 페르소나와 무관하게 공통 적용된다.
 */
export function buildExpiryReminderPrompt(ctx: ExpiryReminderContext): string {
  const { benefit, daysRemaining } = ctx;

  return `당신은 통신사 결합 혜택 추천 서비스 "티모산"의 카카오 알림톡 문구를 작성하는 카피라이터입니다.
지금 작성할 메시지는 페르소나와 무관하게 공통 적용되는 "마감임박 알림"입니다.

# 마감임박 혜택 정보
- 혜택명: [${benefit.provider}] ${benefit.title}
- 월 예상 절감액: ${benefit.monthlySaving.toLocaleString()}원
- 마감일: ${benefit.validTo}
- 오늘 기준 남은 기간: D-${daysRemaining}

D-${daysRemaining}이라는 긴급도에 맞게(D-1이면 오늘내일 안에 결정해야 한다는 긴장감을,
D-7이면 여유는 있지만 잊지 말라는 리마인드 톤을) 자연스럽게 담아 작성하세요.

${COMMON_WRITING_RULES}`;
}
