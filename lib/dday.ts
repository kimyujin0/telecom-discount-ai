// 마이페이지 "저장한 혜택"의 배지(D-day 등) 계산/정렬 — 순수 함수만 둔다(서버·클라이언트 어디서든 import 가능).
//
// 날짜는 전부 한국 시간(Asia/Seoul) 기준 "날짜"로만 비교한다. benefits.valid_to가 시각 없는 date라서,
// 마감일 당일까지는 유효하다고 보고 당일을 D-DAY(0일 남음)로 센다.
//
// 배지를 정하는 우선순위:
//   1) valid_to(실제 마감일)가 있으면 그것만 본다 — 가장 정확한 정보라 이용 조건이 뭐든 기존 D-day 그대로.
//   2) 없으면 usage_condition에서 갱신 주기를 읽는다(lib/usageCycle.ts):
//        일간 "1일 1회"        -> "오늘 사용 가능" (오늘 이미 썼는지는 추적하지 않는다)
//        월간 "월 N회"         -> "이번 달 갱신까지 D-N" (이번 달 말일 기준)
//        월간 창 "매월 15일~말일" -> 창 안이면 "이번 달 종료까지 D-N", 밖이면 "15일부터 이용 가능 · D-N"
//        연간 "연 N회"         -> "올해 갱신까지 D-N" (올해 12/31 기준)
//   3) 주기를 못 읽는 조건은 "조건부 상시", 조건 자체가 없으면 "상시".

import { parseUsageCycle, weekdayChar } from "./usageCycle";

/** 배지 색상 단계. */
export type DdayTone =
  /** 마감일이 지남 — 회색 "마감" */
  | "expired"
  /** 마감일도 이용 조건도 없는 진짜 상시 혜택 — 회색 "상시" */
  | "none"
  /**
   * 마감일은 없지만 주기를 읽을 수 없는 이용 조건(7만원 이상 구매 시 등)이 있는 혜택 — 회색 "조건부 상시".
   * 그냥 "상시"로 두면 조건 없이 언제나 쓸 수 있는 것처럼 오해하기 쉬워서 따로 나눈다.
   */
  | "conditional"
  /** 지금 바로 쓸 수 있는 매일 갱신 혜택 — 초록 "오늘 사용 가능" */
  | "available"
  /** 아직 이용 가능 기간이 아님(매월 15일~말일의 1~14일, 다른 요일) — 회색, 언제부터인지 D-day로 안내 */
  | "upcoming"
  /** 여유 있음 — 회색 */
  | "safe"
  /** 곧 마감/갱신 — 노란색 */
  | "warning"
  /** 임박 — 빨간색 */
  | "danger";

/** 배지가 어떤 근거로 정해졌는지 (테스트/디버깅용). */
export type DdayKind = "fixed" | "daily" | "weekly" | "monthly" | "window" | "yearly" | "none" | "conditional";

export interface DdayInfo {
  /** 남은 일수(또는 시작까지 일수). 해당 없으면 null, 마감일이 지났으면 음수. */
  days: number | null;
  label: string;
  tone: DdayTone;
  kind: DdayKind;
  /** 리스트 상단으로 끌어올릴 "임박"(D-3 이하, 아직 안 지남) 여부. */
  urgent: boolean;
}

/** D-3 이하는 임박으로 보고 저장함 상단에 올린다. */
export const URGENT_MAX_DAYS = 3;

/** 지금 시각의 서울 기준 날짜(YYYY-MM-DD). */
export function todayInSeoul(now: Date = new Date()): string {
  // en-CA 로케일이 YYYY-MM-DD 형식을 돌려준다.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function toUtcDayNumber(date: string): number {
  const { year, month, day } = parseDate(date);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** month는 1~12. 윤년의 2월도 정확히 센다. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** today 기준 validTo까지 남은 일수. 같은 날이면 0, 지났으면 음수. 둘 다 YYYY-MM-DD. */
export function daysUntil(validTo: string, today: string): number {
  return toUtcDayNumber(validTo) - toUtcDayNumber(today);
}

function dLabel(days: number): string {
  return days === 0 ? "D-DAY" : `D-${days}`;
}

/** 마감일 기준 색: D-7 이상 회색, D-3~D-6 노랑, D-2 이하 빨강. */
function fixedTone(days: number): DdayTone {
  if (days >= 7) return "safe";
  if (days >= URGENT_MAX_DAYS) return "warning";
  return "danger";
}

/** 월간(이번 달 말일 기준) 색: D-3 이하 빨강, D-4~D-7 노랑, 그 이상 회색. */
function monthlyTone(days: number): DdayTone {
  if (days <= 3) return "danger";
  if (days <= 7) return "warning";
  return "safe";
}

function cycleInfo(usageCondition: string, today: string): DdayInfo | null {
  const cycle = parseUsageCycle(usageCondition);
  if (!cycle) return null;

  const { year, month, day } = parseDate(today);
  const lastDay = daysInMonth(year, month);

  switch (cycle.kind) {
    case "daily": {
      // 요일 제한이 없거나 오늘이 그 요일이면 "오늘 사용 가능". 오늘 이미 썼는지는 추적하지 않는다.
      if (cycle.weekday === null) {
        return { days: null, label: "오늘 사용 가능", tone: "available", kind: "daily", urgent: false };
      }
      const todayWeekday = new Date(toUtcDayNumber(today) * 86_400_000).getUTCDay();
      if (todayWeekday === cycle.weekday) {
        return { days: 0, label: "오늘 사용 가능", tone: "available", kind: "weekly", urgent: false };
      }
      // 다음 그 요일까지 남은 일수(1~6).
      const days = (cycle.weekday - todayWeekday + 7) % 7;
      return {
        days,
        label: `${weekdayChar(cycle.weekday)}요일 이용 가능 · ${dLabel(days)}`,
        tone: "upcoming",
        kind: "weekly",
        urgent: false,
      };
    }

    case "monthly": {
      const days = lastDay - day;
      return {
        days,
        label: `이번 달 갱신까지 ${dLabel(days)}`,
        tone: monthlyTone(days),
        kind: "monthly",
        urgent: days <= URGENT_MAX_DAYS,
      };
    }

    case "monthly_window": {
      // 31일 시작인데 그 달이 30일까지뿐인 경우 등을 위해 말일로 눌러 담는다.
      const start = Math.min(cycle.startDay, lastDay);
      const end = cycle.endDay === null ? lastDay : Math.min(cycle.endDay, lastDay);

      if (day >= start && day <= end) {
        const days = end - day;
        return {
          days,
          label: `이번 달 종료까지 ${dLabel(days)}`,
          tone: monthlyTone(days),
          kind: "window",
          urgent: days <= URGENT_MAX_DAYS,
        };
      }

      // 창 밖 — 아직 시작 전이면 이번 달 시작일까지, 이미 지났으면 다음 달 시작일까지.
      let days: number;
      if (day < start) {
        days = start - day;
      } else {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const nextStart = Math.min(cycle.startDay, daysInMonth(nextYear, nextMonth));
        days = lastDay - day + nextStart;
      }
      return {
        days,
        label: `${cycle.startDay}일부터 이용 가능 · ${dLabel(days)}`,
        tone: "upcoming",
        kind: "window",
        urgent: false,
      };
    }

    case "yearly": {
      const days = daysUntil(`${year}-12-31`, today);
      return {
        days,
        label: `올해 갱신까지 ${dLabel(days)}`,
        tone: fixedTone(days),
        kind: "yearly",
        urgent: days <= URGENT_MAX_DAYS,
      };
    }
  }
}

export function getDdayInfo(validTo: string | null, today: string, usageCondition?: string | null): DdayInfo {
  // 1) 실제 마감일이 있으면 최우선 — 이용 조건이 있어도 기존 D-day 그대로.
  if (validTo) {
    const days = daysUntil(validTo, today);
    if (days < 0) return { days, label: "마감", tone: "expired", kind: "fixed", urgent: false };

    const tone = fixedTone(days);
    // D-3은 노란색 배지이면서 동시에 "마감 임박"(상단 정렬) 대상이다.
    return { days, label: dLabel(days), tone, kind: "fixed", urgent: days <= URGENT_MAX_DAYS };
  }

  // 공백만 있는 조건은 없는 것으로 본다.
  const condition = usageCondition?.trim();
  if (!condition) return { days: null, label: "상시", tone: "none", kind: "none", urgent: false };

  // 2) 이용 조건에서 갱신 주기를 읽는다.
  const byCycle = cycleInfo(condition, today);
  if (byCycle) return byCycle;

  // 3) 주기를 알 수 없는 조건.
  return { days: null, label: "조건부 상시", tone: "conditional", kind: "conditional", urgent: false };
}

/**
 * 저장함 정렬: 임박(D-3 이하)을 남은 일수 오름차순으로 맨 위에 올리고, 그 아래는 최근에 저장한 순,
 * 이미 마감된 혜택은 맨 아래로 내린다.
 */
export function sortByUrgency<T extends { validTo: string | null; savedAt: string; usageCondition?: string | null }>(
  items: T[],
  today: string,
): T[] {
  const infoOf = (item: T) => getDdayInfo(item.validTo, today, item.usageCondition);
  const rank = (item: T): number => {
    const info = infoOf(item);
    if (info.tone === "expired") return 2;
    return info.urgent ? 0 : 1;
  };

  return [...items].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;

    if (rank(a) === 0) {
      const dayDiff = (infoOf(a).days ?? 0) - (infoOf(b).days ?? 0);
      if (dayDiff !== 0) return dayDiff;
    }
    return b.savedAt.localeCompare(a.savedAt);
  });
}
