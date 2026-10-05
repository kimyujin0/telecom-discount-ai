// getAvailabilityNow()의 간단한 회귀 테스트. 테스트 러너(jest/vitest 등)가 설치되어 있지 않아
// node의 TypeScript 스트리핑만으로 바로 돌아가게 짜여 있다. 시간을 바꿔가며 확인할 수 있도록
// getAvailabilityNow()가 '현재 시각'을 인자로 받으므로, 여기서는 그 인자에 원하는 시각을 그대로 넣는다.
//
// 실행: node --experimental-strip-types lib/usageCycle.test.mts
// (= npm run test:usage-cycle)
//
// 조건 문구는 실제 benefits.usage_condition에 들어있는 값(또는 그 패턴을 본뜬 값)을 그대로 썼다.

import { getAvailabilityNow } from "./usageCycle.ts";

// "+09:00"을 명시하면 서버가 어떤 시간대에서 돌든 항상 같은 서울 시각으로 해석된다.
const kst = (iso: string) => new Date(iso);

interface Case {
  label: string;
  cond: string | null;
  now: string;
  expectAvailable: boolean;
  expectLabel?: string;
  expectJustOpened?: boolean;
}

const cases: Case[] = [
  // ── 시간대 ("아침 5~9시", "20~24시") ──────────────────────────────────
  { label: "오굿모닝 — 아침 7시(범위 안)", cond: "아침 5~9시, 1일 1회", now: "2026-10-05T07:00:00+09:00", expectAvailable: true, expectLabel: "9시까지 사용 가능" },
  { label: "오굿모닝 — 9시 정각(끝난 시각, 포함 안 함)", cond: "아침 5~9시, 1일 1회", now: "2026-10-05T09:00:00+09:00", expectAvailable: false, expectLabel: "5시부터 사용 가능" },
  { label: "오굿모닝 — 새벽 4시(시작 전)", cond: "아침 5~9시, 1일 1회", now: "2026-10-05T04:00:00+09:00", expectAvailable: false, expectLabel: "5시부터 사용 가능" },
  { label: "파리바게뜨 해피아워 — 밤 22시(범위 안)", cond: "20~24시, 1만원 이상 구매 시 4천원 할인", now: "2026-10-05T22:00:00+09:00", expectAvailable: true, expectLabel: "자정까지 사용 가능" },
  { label: "파리바게뜨 해피아워 — 낮 14시(시작 전)", cond: "20~24시, 1만원 이상 구매 시 4천원 할인", now: "2026-10-05T14:00:00+09:00", expectAvailable: false, expectLabel: "20시부터 사용 가능" },
  { label: "자정 넘는 범위(22~2시) — 새벽 1시(wrap, 범위 안)", cond: "22~2시 한정 할인", now: "2026-10-05T01:00:00+09:00", expectAvailable: true },
  { label: "자정 넘는 범위(22~2시) — 낮 12시(범위 밖)", cond: "22~2시 한정 할인", now: "2026-10-05T12:00:00+09:00", expectAvailable: false },

  // ── 요일 ("매주 화요일", "평일 한정") ────────────────────────────────
  { label: "매주 화요일 — 오늘이 화요일", cond: "매주 화요일, 1000원당 200원 할인, 1일 1회 최대 2만원 한도", now: "2026-10-06T12:00:00+09:00", expectAvailable: true, expectLabel: "오늘 사용 가능" },
  { label: "매주 화요일 — 오늘이 토요일", cond: "매주 화요일, 1000원당 200원 할인, 1일 1회 최대 2만원 한도", now: "2026-10-03T12:00:00+09:00", expectAvailable: false, expectLabel: "화요일에만 사용 가능" },
  { label: "평일 한정 — 토요일", cond: "평일 한정, 2시간권 50% 할인, 보호자 1인 무료", now: "2026-10-03T12:00:00+09:00", expectAvailable: false, expectLabel: "평일에만 사용 가능" },
  { label: "평일 한정 — 화요일", cond: "평일 한정, 2시간권 50% 할인, 보호자 1인 무료", now: "2026-10-06T12:00:00+09:00", expectAvailable: true, expectLabel: "오늘 사용 가능" },

  // ── 날짜 범위 ("매월 15일~말일") ──────────────────────────────────────
  { label: "달달초이스 — 15일 0시(오늘 열림)", cond: "매월 15일~말일, 달달초이스 중 택1", now: "2026-10-15T00:00:00+09:00", expectAvailable: true, expectLabel: "오늘 열림", expectJustOpened: true },
  { label: "달달초이스 — 20일(창 안, 막 연 날은 아님)", cond: "매월 15일~말일, 달달초이스 중 택1", now: "2026-10-20T12:00:00+09:00", expectAvailable: true, expectLabel: "이번 달 말일까지 사용 가능" },
  { label: "달달초이스 — 3일(창 밖, 아직 시작 전)", cond: "매월 15일~말일, 달달초이스 중 택1", now: "2026-10-03T12:00:00+09:00", expectAvailable: false, expectLabel: "15일부터 사용 가능" },

  // ── 조건 없음 / 판별 불가 ───────────────────────────────────────────
  { label: "조건 없음(usage_condition=null)", cond: null, now: "2026-10-03T12:00:00+09:00", expectAvailable: true, expectLabel: "" },
  { label: "판별 불가 — 해피아워 시간대 한정", cond: "해피아워 시간대 한정", now: "2026-10-03T12:00:00+09:00", expectAvailable: true, expectLabel: "" },
  { label: "판별 불가 — 구매 금액 조건", cond: "월 1회, 연 6회 중 택1, 7만원 이상 구매 시", now: "2026-10-03T12:00:00+09:00", expectAvailable: true, expectLabel: "" },
  { label: "순수 횟수 조건(월 1회) — 시간/날짜 제한 없음", cond: "월 1회", now: "2026-10-03T12:00:00+09:00", expectAvailable: true, expectLabel: "" },

  // ── 결합(가상 문구) — 요일과 시간대가 같은 조건에 함께 있는 경우 ────────
  { label: "결합: 매주 화요일 아침 5~9시 — 화요일 7시(둘 다 만족)", cond: "매주 화요일 아침 5~9시 한정", now: "2026-10-06T07:00:00+09:00", expectAvailable: true },
  { label: "결합: 매주 화요일 아침 5~9시 — 화요일 11시(요일만 맞음)", cond: "매주 화요일 아침 5~9시 한정", now: "2026-10-06T11:00:00+09:00", expectAvailable: false },
];

let failures = 0;
for (const c of cases) {
  const info = getAvailabilityNow(c.cond, kst(c.now));
  const okAvailable = info.available === c.expectAvailable;
  const okLabel = c.expectLabel === undefined || info.label === c.expectLabel;
  const okJustOpened = c.expectJustOpened === undefined || info.justOpened === c.expectJustOpened;
  const pass = okAvailable && okLabel && okJustOpened;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"} ${c.label}`);
  if (!pass) {
    console.log(
      `     실제: available=${info.available} label="${info.label}" justOpened=${info.justOpened} restrictions=[${info.restrictions}]`,
    );
  }
}

// 판별 불가 조건은 원문을 그대로 보여줘야 한다.
const unknown = getAvailabilityNow("해피아워 시간대 한정", kst("2026-10-03T12:00:00+09:00"));
const rawOk = unknown.rawCondition === "해피아워 시간대 한정";
console.log(`${rawOk ? "PASS" : "FAIL"} rawCondition에 원문 조건이 그대로 담김`);
if (!rawOk) failures++;

console.log(failures === 0 ? `\nALL ${cases.length + 1} CHECKS PASSED` : `\nFAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
