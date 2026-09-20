// 마이페이지 "저장한 혜택"의 마감일(D-day) 계산/정렬 — 순수 함수만 둔다(서버·클라이언트 어디서든 import 가능).
//
// 날짜는 전부 한국 시간(Asia/Seoul) 기준 "날짜"로만 비교한다. benefits.valid_to가 시각 없는 date라서,
// 마감일 당일까지는 유효하다고 보고 당일을 D-DAY(0일 남음)로 센다.

/** 배지 색상 단계. */
export type DdayTone =
  /** 마감일이 지남 — 회색 "마감" */
  | "expired"
  /** 마감일도 이용 조건도 없는 진짜 상시 혜택 — 회색 "상시" */
  | "none"
  /**
   * 마감일은 없지만 이용 조건(아침 5~9시, 1일 1회 등)이 있는 혜택 — 회색 "조건부 상시".
   * 그냥 "상시"로 두면 조건 없이 언제나 쓸 수 있는 것처럼 오해하기 쉬워서 따로 나눈다.
   */
  | "conditional"
  /** D-7 이상 — 회색 */
  | "safe"
  /** D-3 ~ D-6 — 노란색 */
  | "warning"
  /** D-2 이하(당일 포함) — 빨간색 */
  | "danger";

export interface DdayInfo {
  /** 남은 일수. 마감일이 없으면 null, 지났으면 음수. */
  days: number | null;
  label: string;
  tone: DdayTone;
  /** 리스트 상단으로 끌어올릴 "마감 임박"(D-3 이하, 아직 안 지남) 여부. */
  urgent: boolean;
}

/** D-3 이하는 마감 임박으로 보고 저장함 상단에 올린다. */
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

function toUtcDayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** today 기준 validTo까지 남은 일수. 같은 날이면 0, 지났으면 음수. 둘 다 YYYY-MM-DD. */
export function daysUntil(validTo: string, today: string): number {
  return toUtcDayNumber(validTo) - toUtcDayNumber(today);
}

export function getDdayInfo(validTo: string | null, today: string, usageCondition?: string | null): DdayInfo {
  if (!validTo) {
    // 공백만 있는 조건은 없는 것으로 본다.
    const hasCondition = !!usageCondition?.trim();
    return hasCondition
      ? { days: null, label: "조건부 상시", tone: "conditional", urgent: false }
      : { days: null, label: "상시", tone: "none", urgent: false };
  }

  const days = daysUntil(validTo, today);
  if (days < 0) return { days, label: "마감", tone: "expired", urgent: false };

  const label = days === 0 ? "D-DAY" : `D-${days}`;
  if (days >= 7) return { days, label, tone: "safe", urgent: false };
  if (days >= URGENT_MAX_DAYS) {
    // D-3은 노란색 배지이면서 동시에 "마감 임박"(상단 정렬) 대상이다.
    return { days, label, tone: "warning", urgent: days <= URGENT_MAX_DAYS };
  }
  return { days, label, tone: "danger", urgent: true };
}

/**
 * 저장함 정렬: 마감 임박(D-3 이하)을 남은 일수 오름차순으로 맨 위에 올리고, 그 아래는 최근에 저장한 순,
 * 이미 마감된 혜택은 맨 아래로 내린다.
 */
export function sortByUrgency<T extends { validTo: string | null; savedAt: string }>(items: T[], today: string): T[] {
  const rank = (item: T): number => {
    const info = getDdayInfo(item.validTo, today);
    if (info.tone === "expired") return 2;
    return info.urgent ? 0 : 1;
  };

  return [...items].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;

    if (rank(a) === 0) {
      const dayDiff = (getDdayInfo(a.validTo, today).days ?? 0) - (getDdayInfo(b.validTo, today).days ?? 0);
      if (dayDiff !== 0) return dayDiff;
    }
    return b.savedAt.localeCompare(a.savedAt);
  });
}
