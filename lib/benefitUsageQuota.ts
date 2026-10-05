// "썼어요" 버튼이 이번 주기에 더 쓸 수 있는지 판단하는 모듈 — 순수 함수만 둔다(서버·클라이언트 공용).
//
// lib/dday.ts가 "며칠 남았는지" 배지를 정할 때 보는 것과 똑같은 valid_to/usage_condition을 보고,
// "지금 기준 이번 주기의 날짜 범위"와 "그 범위 안에서 허용되는 횟수(limit)"를 구한다. 실제로 그 범위
// 안에서 몇 번 "썼어요"를 눌렀는지는 benefit_usages 테이블에서 세어 이 limit과 비교한다 — 이 모듈은
// 날짜/횟수 계산만 하고 DB는 보지 않는다.
//
// 우선순위는 lib/dday.ts와 동일하게 valid_to가 있으면 그것만 본다 — 실제 마감일이 가장 정확한 정보다.
//
// 알아두어야 할 단순화 두 가지:
//  1) "매월 택1"류(예: KT 달달초이스·VIP초이스, LG U+ 라이프콕) 그룹 묶음은 혜택 행마다 따로 추적한다.
//     한 그룹 안의 다른 혜택을 이미 썼어도 이 혜택의 한도에는 영향을 주지 않는다 — 그룹 간 "하나만"
//     제약은 추적하지 않는다(실제로는 한 묶음에서 하나만 골라야 하는 경우가 있을 수 있다).
//  2) 주기를 알 수 없는 조건("7만원 이상 구매 시" 등)과 진짜 상시 혜택(usage_condition이 없음)은
//     limit=null(무제한)로 둔다 — "이미 다 썼음"을 판단할 기준이 없어서, 쓸 때마다 기록은 남기되
//     버튼을 막지는 않는다.
//
// 버튼이 지금 눌러도 되는 시점인지는 이 모듈이 아니라 lib/dday.ts의 tone으로 판단한다
// ("upcoming"이면 아직 시작 전, "expired"면 끝 — 둘 다 이 모듈을 부르기 전에 걸러낸다).

import { daysInMonth, parseDate, toUtcDayNumber } from "./dday";
import { parseUsageCycle } from "./usageCycle";

/** 쿼터가 어떤 주기를 기준으로 하는지 — 버튼의 "완료" 문구를 고를 때 쓴다. */
export type UsageQuotaKind = "daily" | "monthly" | "yearly" | "once";

export interface UsageQuota {
  kind: UsageQuotaKind;
  /** 이번 주기의 날짜 범위(둘 다 포함, YYYY-MM-DD) — 이 범위에 속하는 사용 기록만 한도에 센다. */
  windowStart: string;
  windowEnd: string;
  /** 이 범위 안에서 허용되는 횟수. null이면 무제한(주기를 모름). */
  limit: number | null;
}

/** 두 날짜 범위(둘 다 포함) 안에 d가 속하는지. YYYY-MM-DD 문자열은 사전식 비교가 날짜 비교와 같다. */
export function isWithinWindow(d: string, quota: Pick<UsageQuota, "windowStart" | "windowEnd">): boolean {
  return d >= quota.windowStart && d <= quota.windowEnd;
}

/** 주기별 "다 썼어요" 상태의 문구. */
export function usageDoneLabel(kind: UsageQuotaKind): string {
  switch (kind) {
    case "daily":
      return "오늘 사용 완료";
    case "monthly":
      return "이번 달 사용 완료";
    case "yearly":
      return "올해 사용 완료";
    case "once":
      return "사용 완료";
  }
}

function pad(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayOf(date: string): number {
  return new Date(toUtcDayNumber(date) * 86_400_000).getUTCDay();
}

// "일 N회" / "하루 N회"의 N. 못 찾으면("매일"만 있을 때) 1회로 본다.
function dailyCount(text: string): number {
  const match = /(?:^|[^가-힣\d])(?:\d+\s*)?일\s*(\d+)\s*회|하루\s*(\d+)\s*회/.exec(text);
  return Number(match?.[1] ?? match?.[2] ?? 1);
}

// "월 N회"의 N ("3개월"의 월은 parseUsageCycle이 이미 걸러낸 뒤라 신경 쓰지 않아도 된다).
// 못 찾으면("매월"만 있을 때) 1회로 본다.
function monthlyCount(text: string): number {
  const match = /(?<!개)월\s*(\d+)\s*회/.exec(text);
  return Number(match?.[1] ?? 1);
}

// "연 N회"의 N. 못 찾으면("매년", "1년에"만 있을 때) 1회로 본다.
function yearlyCount(text: string): number {
  const match = /연\s*(\d+)\s*회/.exec(text);
  return Number(match?.[1] ?? 1);
}

/**
 * 오늘(today) 기준 이번 주기의 날짜 범위와 허용 횟수.
 *
 * valid_to(실제 마감일)가 있으면 usage_condition과 무관하게 "최초 1회, 마감 전까지"로 본다
 * (lib/dday.ts가 D-day 배지를 정할 때와 같은 우선순위). 주기를 전혀 알 수 없으면 null(무제한)을 반환한다.
 * 매주 특정 요일에만 쓸 수 있는데 오늘이 그 요일이 아닌 경우도 null을 반환한다 — 이때는 lib/dday.ts의
 * tone이 이미 "upcoming"이라 호출부에서 이 모듈을 부르기 전에 걸러지는 게 보통이다.
 */
export function getUsageQuota(
  validTo: string | null,
  today: string,
  usageCondition?: string | null,
): UsageQuota | null {
  if (validTo) return { kind: "once", windowStart: "1970-01-01", windowEnd: validTo, limit: 1 };

  const text = usageCondition?.trim();
  if (!text) return null;

  const cycle = parseUsageCycle(text);
  if (!cycle) return null;

  switch (cycle.kind) {
    case "daily": {
      if (cycle.weekday !== null && weekdayOf(today) !== cycle.weekday) return null;
      return { kind: "daily", windowStart: today, windowEnd: today, limit: dailyCount(text) };
    }

    case "monthly": {
      const { year, month } = parseDate(today);
      const last = daysInMonth(year, month);
      return { kind: "monthly", windowStart: pad(year, month, 1), windowEnd: pad(year, month, last), limit: monthlyCount(text) };
    }

    case "monthly_window": {
      const { year, month, day } = parseDate(today);
      const last = daysInMonth(year, month);
      const start = Math.min(cycle.startDay, last);
      const end = cycle.endDay === null ? last : Math.min(cycle.endDay, last);
      if (day < start || day > end) return null; // 창 밖 — 아직 쓸 수 있는 기간이 아니다.
      // 창 안에서 몇 번 쓸 수 있는지 수치가 없는 조건("달달초이스 중 택1")은 1회로 본다.
      return { kind: "monthly", windowStart: pad(year, month, start), windowEnd: pad(year, month, end), limit: 1 };
    }

    case "yearly": {
      const { year } = parseDate(today);
      return { kind: "yearly", windowStart: `${year}-01-01`, windowEnd: `${year}-12-31`, limit: yearlyCount(text) };
    }
  }
}
