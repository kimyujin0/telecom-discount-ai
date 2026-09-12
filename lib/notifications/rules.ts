// 알림(카카오 "나에게 보내기"/알림톡) 발송 규칙 정의.
// 이 파일은 "언제 보낼지"에 대한 순수 규칙/판정 로직만 다룬다.
// 실제 스케줄러(cron)나 카카오 발송 API 연동은 아직 없다 — 이 파일의 함수들은
// 향후 스케줄러가 매일/매시 호출해 "지금 보낼 대상인지"를 판정하는 용도로 쓰일 예정이다.

import type { PersonaKey } from "@/lib/chat/personas";

export type NotificationFrequency = "weekly" | "monthly" | "seasonal" | "event-based" | "weekly-summary";

export interface NotificationSchedule {
  /** 사람이 읽는 규칙 요약 (관리자 로그/디버깅용, 고객 노출 문구 아님) */
  summary: string;
  /** 0=일 ~ 6=토. 미지정 시 요일 무관. */
  daysOfWeek?: number[];
  /** 24시간제, 로컬 타임존 기준. endHour는 미포함(exclusive). */
  timeRange?: { startHour: number; endHour: number };
  /** 1~12. 미지정 시 월 무관. */
  months?: number[];
  /** 일(day-of-month) 범위, 1~31. "매월 초" 같은 규칙에 사용. */
  dayOfMonthRange?: { start: number; end: number };
  /** 날짜 계산만으로 표현하기 어려운 규칙 설명 (예: 명절 연휴 전 집중) */
  specialNote?: string;
  frequency: NotificationFrequency;
  /**
   * false면 matchesSchedule()이 항상 false를 반환한다 — 공휴일 캘린더 연동처럼 별도 데이터가
   * 있어야 날짜를 계산할 수 있는 규칙(specialNote 참고)에 사용. 생략 시 true(자동 판정 가능).
   */
  automatic?: boolean;
}

export interface PersonaNotificationRule {
  personaKey: PersonaKey;
  /** 발송 가능 시간대 slot 목록 — OR 조건(하나라도 맞으면 발송 대상). */
  slots: NotificationSchedule[];
  /** 메시지 생성 프롬프트에 넘길 톤 힌트 (고객 노출 고정 문구 아님, LLM 재료용) */
  toneHint: string;
}

// CLAUDE.md 기준 6종 페르소나별 발송 규칙.
export const PERSONA_NOTIFICATION_RULES: PersonaNotificationRule[] = [
  {
    personaKey: "media_lover",
    slots: [
      {
        summary: "금요일 저녁",
        daysOfWeek: [5],
        timeRange: { startHour: 18, endHour: 22 },
        frequency: "weekly",
      },
      {
        summary: "주말 오후",
        daysOfWeek: [0, 6],
        timeRange: { startHour: 13, endHour: 18 },
        frequency: "weekly",
      },
    ],
    toneHint: "불금/주말에 넷플릭스·OTT 몰아볼 생각에 설레는 기분을 살짝 얹은 캐주얼한 톤",
  },
  {
    personaKey: "practical_living",
    slots: [
      {
        summary: "평일 저녁 6~8시",
        daysOfWeek: [1, 2, 3, 4, 5],
        timeRange: { startHour: 18, endHour: 20 },
        frequency: "weekly",
      },
    ],
    toneHint: "퇴근 후 하루를 정리하는 시간에, 생활비를 실속 있게 아낀다는 안정감을 주는 톤",
  },
  {
    personaKey: "travel_nomad",
    slots: [
      {
        summary: "매월 초",
        dayOfMonthRange: { start: 1, end: 5 },
        frequency: "monthly",
      },
      {
        summary: "여행 성수기(7~8월) 집중",
        months: [7, 8],
        frequency: "seasonal",
      },
      {
        summary: "명절 연휴 전 집중",
        specialNote:
          "설날/추석 등 명절 연휴 시작 며칠 전 집중 발송 — 매년 날짜가 달라 공휴일 캘린더 연동이 필요하다. " +
          "자동 판정 대상이 아니며(automatic: false), 스케줄러 구현 시 캘린더 데이터를 바탕으로 별도 트리거해야 한다.",
        frequency: "event-based",
        automatic: false,
      },
    ],
    toneHint: "다음 여행을 상상하게 만드는 설레는 톤, 로밍/항공 혜택을 놓치면 아깝다는 긴장감을 살짝",
  },
  {
    personaKey: "caffeine_charger",
    slots: [
      {
        summary: "월요일 오전",
        daysOfWeek: [1],
        timeRange: { startHour: 8, endHour: 11 },
        frequency: "weekly",
      },
    ],
    toneHint: "월요병에 시달리는 아침, 커피 한 잔의 위로를 건네는 다정하고 힘 나는 톤",
  },
  {
    personaKey: "mobility",
    slots: [
      {
        summary: "평일 출근 시간대",
        daysOfWeek: [1, 2, 3, 4, 5],
        timeRange: { startHour: 7, endHour: 9 },
        frequency: "weekly",
      },
    ],
    toneHint: "바쁜 출근길에 부담 없이 빠르게 읽히는, 간결하고 실용적인 톤",
  },
  {
    personaKey: "balance",
    slots: [
      {
        summary: "월요일 오전, 주간 요약형",
        daysOfWeek: [1],
        timeRange: { startHour: 8, endHour: 11 },
        frequency: "weekly-summary",
      },
    ],
    toneHint: "한 주를 시작하며 여러 혜택을 고르게 챙겨준다는 균형 잡힌, 차분하고 신뢰감 있는 톤",
  },
];

export function getPersonaNotificationRule(personaKey: PersonaKey): PersonaNotificationRule | undefined {
  return PERSONA_NOTIFICATION_RULES.find((rule) => rule.personaKey === personaKey);
}

/** schedule 하나가 주어진 시각(date)에 해당하는지 판정한다. */
export function matchesSchedule(schedule: NotificationSchedule, date: Date): boolean {
  if (schedule.automatic === false) return false;

  if (schedule.months && !schedule.months.includes(date.getMonth() + 1)) return false;
  if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(date.getDay())) return false;

  if (schedule.dayOfMonthRange) {
    const day = date.getDate();
    if (day < schedule.dayOfMonthRange.start || day > schedule.dayOfMonthRange.end) return false;
  }

  if (schedule.timeRange) {
    const hour = date.getHours();
    if (hour < schedule.timeRange.startHour || hour >= schedule.timeRange.endHour) return false;
  }

  return true;
}

/** 이 페르소나가 지금(date) 발송 대상인지 — slot 중 하나라도 맞으면 true. */
export function isPersonaNotificationDue(personaKey: PersonaKey, date: Date = new Date()): boolean {
  const rule = getPersonaNotificationRule(personaKey);
  if (!rule) return false;
  return rule.slots.some((slot) => matchesSchedule(slot, date));
}

// ============================================================
// 마감임박 알림 (페르소나 무관 공통 규칙)
// ============================================================

export const EXPIRY_REMINDER_DAYS = [7, 3, 1] as const;
export type ExpiryReminderDay = (typeof EXPIRY_REMINDER_DAYS)[number];

function toUtcDayNumber(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * 오늘(referenceDate)이 혜택의 valid_to(YYYY-MM-DD) 기준 D-7/D-3/D-1에 해당하면 그 값을,
 * 아니면 null을 반환한다. 스케줄러(미구현)가 매일 한 번씩 활성 혜택 전체를 순회하며
 * 이 함수로 오늘 마감임박 알림을 보낼 대상인지 판정하는 용도.
 */
export function matchExpiryReminderDay(
  validTo: string,
  referenceDate: Date = new Date(),
): ExpiryReminderDay | null {
  const [year, month, day] = validTo.split("-").map(Number);
  if (!year || !month || !day) return null;

  const expiryDayNumber = toUtcDayNumber(year, month, day);
  const todayDayNumber = toUtcDayNumber(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    referenceDate.getDate(),
  );

  const daysRemaining = expiryDayNumber - todayDayNumber;
  return (EXPIRY_REMINDER_DAYS as readonly number[]).includes(daysRemaining)
    ? (daysRemaining as ExpiryReminderDay)
    : null;
}
