// benefits.usage_condition 텍스트에서 "갱신 주기"를 뽑는 파서 — 순수 함수만 둔다(서버·클라이언트 공용).
//
// 마감일(valid_to)이 없는 혜택은 조건 문구가 사실상 유일한 기간 정보라서, 저장함 D-day 배지(lib/dday.ts)가
// 이 결과로 "오늘 사용 가능 / 이번 달 갱신까지 / 올해 갱신까지" 같은 기준을 정한다.
//
// 단순 키워드("월" 포함 → 월간, "일" 포함 → 일간, "연" 포함 → 연간)로는 실제 데이터에서 틀리는 경우가 있어
// 숫자와 "회"까지 함께 보는 정규식을 쓴다:
//   - "연 12회, 1회 3개월 무료"  : "개월"의 "월"이 월간으로 잡히면 안 된다 -> 앞이 "개"인 월은 제외
//   - "월 1회, 연 3회 한도"      : 월/연이 같이 있으면 더 짧은 주기(월)가 실제 갱신 단위 -> 월 > 일 > 연 순
//   - "평일 한정", "1.1만원 이상"  : "일"이 들어가도 "N일 M회" 꼴이 아니면 일간이 아니다
//   - "매주 화요일, ..., 1일 1회"  : 화요일에만 쓸 수 있는데 "오늘 사용 가능"으로 보이면 안 된다 -> 요일 제한 표시
// 어떤 주기로도 볼 수 없는 조건("전 등급 적용", "7만원 이상 구매 시" 등)은 null — "조건부 상시"로 남는다.

export type UsageCycle =
  /** "1일 1회", "매일", "하루 2회". weekday가 있으면 "매주 화요일"처럼 그 요일에만 이용 가능(0=일 ... 6=토). */
  | { kind: "daily"; weekday: number | null }
  /** "월 1회", "월 3회", "매월" — 매달 초기화. */
  | { kind: "monthly" }
  /** "매월 15일~말일" — 매달 startDay부터 endDay(말일이면 null)까지만 이용 가능. */
  | { kind: "monthly_window"; startDay: number; endDay: number | null }
  /** "연 6회", "매년" — 매년 초기화. */
  | { kind: "yearly" };

const WEEKDAY_CHARS = "일월화수목금토";

/** 0=일 ... 6=토 → "화" 같은 한 글자 요일. */
export function weekdayChar(weekday: number): string {
  return WEEKDAY_CHARS[weekday];
}

// 매월 15일~말일 / 매월 15일~20일 / 매월 15~20일
const MONTHLY_WINDOW = /매월\s*(\d{1,2})\s*일?\s*[~～\-–]\s*(?:(말일)|(\d{1,2})\s*일?)/;
// 월 1회 / 월 3회 / 매월 — "3개월"의 월은 제외
const MONTHLY = /매월|(?<!개)월\s*\d+\s*회/;
// 매주 화요일
const WEEKLY = /매주\s*([일월화수목금토])\s*요일/;
// 1일 1회 / 일 2회 / 하루 1회 / 매일 — "N일 M회" 꼴만 인정 (앞이 한글이면 "평일 1회" 같은 다른 단어)
const DAILY = /(?:^|[^가-힣\d])(?:\d+\s*)?일\s*\d+\s*회|하루\s*\d+\s*회|매일/;
// 연 3회 / 연 12회 / 매년 / 1년에
const YEARLY = /연\s*\d+\s*회|매년|1\s*년에/;

export function parseUsageCycle(usageCondition: string | null | undefined): UsageCycle | null {
  const text = usageCondition?.trim();
  if (!text) return null;

  const window = MONTHLY_WINDOW.exec(text);
  if (window) {
    const startDay = Number(window[1]);
    const endDay = window[2] ? null : Number(window[3]);
    return { kind: "monthly_window", startDay, endDay };
  }

  if (MONTHLY.test(text)) return { kind: "monthly" };

  const weekly = WEEKLY.exec(text);
  if (weekly) return { kind: "daily", weekday: WEEKDAY_CHARS.indexOf(weekly[1]) };
  if (DAILY.test(text)) return { kind: "daily", weekday: null };

  if (YEARLY.test(text)) return { kind: "yearly" };

  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// "지금 당장 쓸 수 있는가" 판별 — parseUsageCycle()은 "갱신 주기"(몇 번까지/언제 리셋)를 보지만,
// 여기서는 "오늘·지금 이 순간 조건을 만족하는가"만 본다. 같은 문구에 두 개념이 같이 들어있는 경우가
// 있어서(예: "아침 5~9시, 1일 1회" — 시간대 제한 + 일일 횟수), 원문 텍스트에서 독립적으로 각각 찾는다.
//
// 인식하는 제한 3가지:
//   1) 시간대   "아침 5~9시", "20~24시", "오후 8시~자정" 등 — TIME_RANGE
//   2) 요일     "매주 화요일"(parseUsageCycle 재사용) / "평일 한정", "주말" — WEEKDAY_SET_PATTERN
//   3) 날짜 범위 "매월 15일~말일"(parseUsageCycle의 monthly_window 재사용)
// 셋 다 없으면(조건이 없거나, "7만원 이상 구매 시"처럼 판별 불가한 문구면) 항상 사용 가능으로 보고,
// 판별 불가한 경우에만 원문을 rawCondition에 그대로 담아 화면에서 보여줄 수 있게 한다.

export interface AvailabilityNow {
  /** 지금(now) 이 조건을 만족해 사용할 수 있는지. */
  available: boolean;
  /** 사용자에게 보여줄 한 줄 문구 (예: "9시까지 사용 가능"). 조건이 없거나 판별 불가하면 빈 문자열. */
  label: string;
  /** "오늘 새로 열린" 혜택 강조용 — 매월 창 조건이 오늘 막 시작한 경우(예: 매월 15일~말일의 15일)만 true. */
  justOpened: boolean;
  /** 어떤 종류의 제한으로 판정했는지 (여러 개면 전부 동시에 만족해야 한다). 비어 있으면 제한 없음/판별 불가. */
  restrictions: Array<"time" | "weekday" | "date_window">;
  /** restrictions가 비어 있고 조건 문구 자체는 있을 때만 원문을 그대로 담는다. */
  rawCondition: string | null;
  /**
   * 지금 사용 가능할 때, 그 상태가 몇 분 뒤에 끝나는지(가장 빨리 끝나는 제한 기준). "곧 닫히는" 혜택을
   * 위로 올려 보여주는 정렬용이다 — 제한이 없거나(always) 지금 사용 불가면 null.
   */
  minutesRemaining: number | null;
}

// "평일"=월~금(1~5), "주말"=토·일(6,0) — parseUsageCycle의 WEEKLY("매주 화요일")는 요일 하루만 잡아서
// 요일 "집합"을 말하는 이 표현들은 별도로 찾는다.
const WEEKDAY_SET: Record<string, number[]> = { 평일: [1, 2, 3, 4, 5], 주말: [0, 6] };
const WEEKDAY_SET_PATTERN = /평일|주말/;

// "아침 5~9시" / "20~24시" / "오후 8시~자정" 등. 뒤쪽 숫자에는 "시"를 필수로 요구해야
// "최대 50~55% 할인" 같은 수치 범위(할인율·금액)를 시간대로 잘못 읽지 않는다.
const TIME_RANGE =
  /(오전|오후|아침|새벽|저녁|밤)?\s*(\d{1,2})\s*시?\s*[~\-]\s*(?:(오전|오후)\s*)?(?:(\d{1,2})\s*시|(자정|정오))/;

function toHour24(prefix: string | undefined, hourStr: string): number {
  let hour = Number(hourStr);
  if (prefix === "오후" || prefix === "저녁" || prefix === "밤") {
    if (hour < 12) hour += 12;
  } else if (prefix === "오전" && hour === 12) {
    hour = 0;
  }
  return hour;
}

function hourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "자정";
  if (hour === 12) return "정오";
  return `${hour}시`;
}

/**
 * 지금(now)의 서울 기준 날짜/시각/요일. lib/dday.ts에 비슷한 함수(todayInSeoul)가 있지만, 그 파일이
 * 이 파일의 parseUsageCycle을 쓰고 있어서(순환 참조 방지) 날짜 산술을 이 파일 안에 작게 다시 둔다.
 */
function seoulNow(now: Date): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  // 요일은 타임존에 영향받지 않는 "달력 사실"이라, 위에서 구한 서울 날짜를 UTC 기준으로 넣어 구한다.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, hour: get("hour"), minute: get("minute"), weekday };
}

/** month는 1~12. lib/dday.ts의 daysInMonth와 같은 계산이지만 순환 참조를 피하려 다시 둔다. */
function daysInMonthOf(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

interface AvailabilityCheck {
  kind: "time" | "weekday" | "date_window";
  available: boolean;
  label: string;
  justOpened: boolean;
  /** 지금 사용 가능할 때, 이 제한이 몇 분 뒤에 닫히는지. 사용 불가 상태면 null(아래에서 걸러낸다). */
  minutesRemaining: number | null;
}

export function getAvailabilityNow(usageCondition: string | null | undefined, now: Date = new Date()): AvailabilityNow {
  const text = usageCondition?.trim();
  if (!text) return { available: true, label: "", justOpened: false, restrictions: [], rawCondition: null, minutesRemaining: null };

  const seoul = seoulNow(now);
  const nowMinute = seoul.hour * 60 + seoul.minute;
  const checks: AvailabilityCheck[] = [];

  const time = TIME_RANGE.exec(text);
  if (time) {
    const [, prefix1, hour1, prefix2, hour2, special] = time;
    const startHour = toHour24(prefix1, hour1);
    const endHour = special === "자정" ? 24 : special === "정오" ? 12 : toHour24(prefix2, hour2);
    const startMinute = startHour * 60;
    let endMinute = endHour * 60;
    let adjustedNow = nowMinute;
    if (endMinute <= startMinute) {
      endMinute += 24 * 60;
      if (adjustedNow < startMinute) adjustedNow += 24 * 60;
    }
    const ok = adjustedNow >= startMinute && adjustedNow < endMinute;
    checks.push({
      kind: "time",
      available: ok,
      label: ok ? `${hourLabel(endHour)}까지 사용 가능` : `${hourLabel(startHour)}부터 사용 가능`,
      justOpened: false,
      minutesRemaining: ok ? endMinute - adjustedNow : null,
    });
  }

  const cycle = parseUsageCycle(text);

  if (cycle?.kind === "daily" && cycle.weekday !== null) {
    const ok = seoul.weekday === cycle.weekday;
    checks.push({
      kind: "weekday",
      available: ok,
      label: ok ? "오늘 사용 가능" : `${weekdayChar(cycle.weekday)}요일에만 사용 가능`,
      justOpened: false,
      // 요일 조건은 오늘 자정에 닫힌다(그 요일인 동안만 유효).
      minutesRemaining: ok ? 24 * 60 - nowMinute : null,
    });
  } else {
    const setMatch = WEEKDAY_SET_PATTERN.exec(text);
    if (setMatch) {
      const ok = WEEKDAY_SET[setMatch[0]].includes(seoul.weekday);
      checks.push({
        kind: "weekday",
        available: ok,
        label: ok ? "오늘 사용 가능" : `${setMatch[0]}에만 사용 가능`,
        justOpened: false,
        minutesRemaining: ok ? 24 * 60 - nowMinute : null,
      });
    }
  }

  if (cycle?.kind === "monthly_window") {
    const lastDay = daysInMonthOf(seoul.year, seoul.month);
    const start = Math.min(cycle.startDay, lastDay);
    const end = cycle.endDay === null ? lastDay : Math.min(cycle.endDay, lastDay);
    const ok = seoul.day >= start && seoul.day <= end;
    const justOpened = ok && seoul.day === start;
    checks.push({
      kind: "date_window",
      available: ok,
      label: justOpened ? "오늘 열림" : ok ? `${end === lastDay ? "이번 달 말일" : `${end}일`}까지 사용 가능` : `${start}일부터 사용 가능`,
      justOpened,
      // 창이 끝나는 날의 자정까지를 "남은 시간"으로 본다.
      minutesRemaining: ok ? (end - seoul.day) * 24 * 60 + (24 * 60 - nowMinute) : null,
    });
  }

  if (checks.length === 0) {
    // 조건 문구는 있지만 위 3가지 중 어떤 것으로도 못 읽은 경우(예: "7만원 이상 구매 시") — 항상 사용
    // 가능으로 두고, 화면에서 원문을 그대로 보여줄 수 있게 넘긴다.
    return { available: true, label: "", justOpened: false, restrictions: [], rawCondition: text, minutesRemaining: null };
  }

  const remaining = checks.map((c) => c.minutesRemaining).filter((m): m is number => m !== null);

  return {
    available: checks.every((c) => c.available),
    label: checks.map((c) => c.label).join(" · "),
    justOpened: checks.some((c) => c.justOpened),
    restrictions: checks.map((c) => c.kind),
    rawCondition: null,
    minutesRemaining: remaining.length > 0 ? Math.min(...remaining) : null,
  };
}
