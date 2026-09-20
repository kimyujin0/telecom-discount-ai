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
