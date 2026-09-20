#!/usr/bin/env node
// KT 등급별 혜택(/carriers 페이지용, source_url='carrier-page-seed') 재구성 스크립트.
//
// 배경: KT 멤버십은 등급별 포인트 한도 방식에서 "전 등급 공통 상시혜택" + "VIP·VVIP 전용 초이스 혜택" 구조로
// 바뀌었다(아래 구조는 요청자가 정리해 준 내용을 그대로 옮긴 것 — 코드에서 사실 여부를 검증하지 않는다).
// 이전 데이터는 이 구조가 없어서 VVIP 혜택 수(4개)가 VIP(7개)보다 적게 보였다.
//
// 사용법 (프로젝트 루트에서):
//   node --env-file=.env.local scripts/rebuild-kt-benefits.mjs --dry-run   # 계획만 출력
//   node --env-file=.env.local scripts/rebuild-kt-benefits.mjs             # 실제 적용
//
// 멱등이다 — 여러 번 실행해도 결과가 같다. 행을 지우지 않는다:
//   - 새 구조에 대응되는 기존 행은 같은 id로 제자리 수정한다(saved_benefits와 과거 진단 결과
//     diagnosis_result_benefits가 benefit id를 참조하므로, 지우면 저장한 혜택이 사라지거나 FK 오류가 난다).
//   - 대응이 없는 기존 행은 is_active=false로 내린다(복구하려면 true로 되돌리면 된다).
//   - tier가 없는 demo-seed KT 행(진단 데모용 persona_category 혜택)은 건드리지 않는다.
//
// estimated_monthly_saving은 "예상 월 절감액"이다. 요청자가 금액을 준 항목은 그 값을, 기존 DB에 값이 있던
// 항목은 기존 값을 쓰고, 나머지는 아래 주석에 "추정"으로 표시한 임시값이다 — 실제 금액을 알게 되면 고쳐야 한다.

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const CARRIER = "KT";
const SOURCE = "carrier-page-seed";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (node --env-file=.env.local ...).");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ─── 등급 ────────────────────────────────────────────────────────────────
const KT_TIERS = ["VVIP", "VIP", "GOLD", "SILVER", "WHITE", "일반"]; // lib/carrierTiers.ts 와 동일해야 한다
const ALL = KT_TIERS.join(","); // 전 등급 공통
const VIP_UP = "VIP,VVIP"; // VIP 이상
const VVIP_ONLY = "VVIP";

const CATEGORIES = ["쇼핑", "외식", "카페", "영화/문화", "여행/레저", "통신/기타"];

// lib/carrierTiers.ts 의 tierMatches 와 같은 규칙.
const tierMatches = (benefitTier, selected) =>
  benefitTier === "전체" || (benefitTier ?? "").split(/[,·/]/).map((t) => t.trim()).includes(selected);

// ─── 새 KT 구조 ──────────────────────────────────────────────────────────
// legacy: 이 행이 대체하는 기존 행 { title, tier } — 있으면 같은 id로 제자리 수정한다.
// group : "택1" 묶음 이름. 같은 묶음 안에서는 한 번에 하나만 고를 수 있다(집계 시 최댓값 하나만 센다).
const DALDAL_USAGE = "매월 15일~말일, 달달초이스 중 택1";
const DALDAL_DESC = "달달초이스 — 매월 15일~말일 동안 준비된 혜택 중 하나를 골라 이용 (전 등급 공통)";
const VIP_CHOICE_DESC = "VIP초이스 — 연 6회, 밀리의서재 1개월 무료 / SNOW 1개월 구독권 / ABC마트 1만원 할인 중 택1 (VIP·VVIP)";

const daldal = (name, category, discount_type, estimated_monthly_saving, extra = {}) => ({
  title: `달달초이스-${name}`,
  tier: ALL,
  category,
  discount_type,
  discount_value: null,
  estimated_monthly_saving,
  usage_condition: DALDAL_USAGE,
  description: `${DALDAL_DESC} · ${name}`,
  group: "달달초이스",
  ...extra,
});

const ROWS = [
  // ══════ 전 등급 공통 (VVIP, VIP, GOLD, SILVER, WHITE, 일반) ══════
  {
    title: "오굿모닝(던킨도너츠·파리바게트·GS25)",
    tier: ALL,
    category: "카페",
    discount_type: "percent",
    discount_value: 30,
    estimated_monthly_saving: 4500, // 기존 값 유지
    usage_condition: "아침 5~9시, 1일 1회",
    description: "아침 5~9시 던킨도너츠·파리바게트·GS25 최대 30% 할인 (전 등급 공통)",
    legacy: { title: "오굿모닝(던킨도너츠·파리바게트·GS25)", tier: "전체" },
  },
  // 달달초이스 — 항목별로 따로. 쿠폰류는 금액을 알 수 없어 기존 달달혜택의 3,000원(기존 값)을 그대로 쓴다.
  daldal("메가MGC커피", "카페", "coupon", 3000),
  daldal("도미노피자", "외식", "coupon", 3000),
  daldal("파리바게뜨", "카페", "coupon", 3000, { legacy: { title: "달달혜택(파리바게트 등)", tier: "전체" } }),
  daldal("뚜레쥬르", "카페", "coupon", 3000),
  // 영화권 13,000원 — 기존 롯데시네마(VIP, 월 1회 무료관람)의 값을 이어받는다.
  daldal("롯데시네마·메가박스 영화권", "영화/문화", "free_item", 13000, { legacy: { title: "롯데시네마", tier: "VIP" } }),
  daldal("SNOW 1개월", "통신/기타", "free_item", 4900), // 4,900원은 추정
  daldal("CJ더마켓", "쇼핑", "coupon", 3000),
  daldal("샐러디", "외식", "coupon", 3000),
  daldal("배달의민족", "외식", "coupon", 3000),
  {
    title: "QED 골프아카데미",
    tier: ALL,
    category: "여행/레저",
    discount_type: "fixed_amount",
    discount_value: 30000,
    estimated_monthly_saving: 2500, // 3만원 ÷ 12 — 연 1회 이용 가정(추정)
    usage_condition: null,
    description: "QED 골프아카데미 3만원 할인 (전 등급 공통)",
  },
  {
    title: "어바웃펫",
    tier: ALL,
    category: "통신/기타",
    discount_type: "coupon",
    discount_value: null,
    estimated_monthly_saving: 3000, // 추정
    usage_condition: null,
    description: "반려동물 플랫폼 어바웃펫 할인 (전 등급 공통)",
  },
  {
    title: "공차",
    tier: ALL,
    category: "카페",
    discount_type: "coupon",
    discount_value: null,
    estimated_monthly_saving: 3000, // 추정
    usage_condition: null,
    description: "공차 할인 (전 등급 공통)",
  },

  // ══════ VIP 이상 전용 (VIP, VVIP) ══════
  {
    title: "VIP초이스-밀리의서재",
    tier: VIP_UP,
    category: "통신/기타",
    discount_type: "free_item",
    discount_value: null,
    estimated_monthly_saving: 9900, // 기존 값 유지 (1회 1개월 무료 가치)
    usage_condition: "월 1회, 연 6회 중 택1, 1회 1개월 무료",
    description: `${VIP_CHOICE_DESC} · 밀리의서재 1개월 무료`,
    group: "VIP초이스",
    legacy: { title: "밀리의서재", tier: "VIP" },
  },
  {
    title: "VIP초이스-SNOW",
    tier: VIP_UP,
    category: "통신/기타",
    discount_type: "free_item",
    discount_value: null,
    estimated_monthly_saving: 4900, // 추정 (달달초이스 SNOW와 동일)
    usage_condition: "월 1회, 연 6회 중 택1, 1회 1개월 구독",
    description: `${VIP_CHOICE_DESC} · SNOW 1개월 구독권`,
    group: "VIP초이스",
  },
  {
    title: "VIP초이스-ABC마트",
    tier: VIP_UP,
    category: "쇼핑",
    discount_type: "fixed_amount",
    discount_value: 10000,
    estimated_monthly_saving: 10000,
    usage_condition: "월 1회, 연 6회 중 택1, 7만원 이상 구매 시",
    description: `${VIP_CHOICE_DESC} · ABC마트 1만원 할인 (7만원 이상 구매 시)`,
    group: "VIP초이스",
    legacy: { title: "ABC마트", tier: "VIP" },
  },
  {
    title: "플레이타임 키즈카페",
    tier: VIP_UP,
    category: "여행/레저",
    discount_type: "percent",
    discount_value: 50,
    estimated_monthly_saving: 8000, // 기존 값 유지
    usage_condition: "평일 한정, 2시간권 50% 할인, 보호자 1인 무료",
    description: "플레이타임 키즈카페 평일 2시간권 50% 할인 + 보호자 1인 무료 (VIP·VVIP)",
    legacy: { title: "플레이타임 키즈카페", tier: "VIP" },
  },
  {
    title: "백야드 골프",
    tier: VIP_UP,
    category: "여행/레저",
    discount_type: "free_item",
    discount_value: null,
    estimated_monthly_saving: 3000, // 추정
    usage_condition: null,
    description: "백야드 골프 숏게임 1시간 무료 (VIP·VVIP)",
  },

  // ══════ VVIP 전용 ══════
  {
    title: "VVIP초이스-밀리의서재",
    tier: VVIP_ONLY,
    category: "통신/기타",
    discount_type: "free_item",
    discount_value: null,
    estimated_monthly_saving: 29700, // 3개월 무료 = 9,900 × 3 (1회 이용 가치, 추정)
    usage_condition: "월 1회, 연 12회 중 택1 (VIP초이스보다 2배 빈도), 1회 3개월 무료",
    description: "VVIP초이스 — 연 12회, 밀리의서재 3개월 무료 (VVIP 전용)",
    group: "VVIP초이스",
    legacy: { title: "밀리의서재", tier: "VVIP" },
  },
  {
    title: "플레이타임 키즈카페 월 1회 완전무료",
    tier: VVIP_ONLY,
    category: "여행/레저",
    discount_type: "free_item",
    discount_value: null,
    estimated_monthly_saving: 16000, // VIP의 50% 할인(8,000원)의 전액 = 16,000원 (추정)
    usage_condition: "월 1회",
    description: "플레이타임 키즈카페 월 1회 완전 무료 — VIP의 50% 할인보다 업그레이드된 VVIP 전용 혜택",
  },
  {
    title: "롯데시네마 생일 무료영화 3매",
    tier: VVIP_ONLY,
    category: "영화/문화",
    discount_type: "free_item",
    discount_value: null,
    estimated_monthly_saving: 3250, // 13,000원 × 3매 ÷ 12 — 연 1회 생일 이벤트 가정(추정)
    usage_condition: "생일 이벤트(연 1회), 무료영화 3매",
    description: "롯데시네마 생일 무료영화 3매 (VVIP 전용 생일 이벤트)",
  },
];

// 새 구조에 대응이 없는 기존 행 — 삭제하지 않고 비활성화한다.
const RETIRE = [{ title: "CGV·메가박스", tier: "전체" }];

// ─── 사전 검증 ───────────────────────────────────────────────────────────
for (const row of ROWS) {
  if (!CATEGORIES.includes(row.category)) throw new Error(`잘못된 category: ${row.title} -> ${row.category}`);
  if (!["percent", "fixed_amount", "coupon", "free_item"].includes(row.discount_type)) throw new Error(`잘못된 discount_type: ${row.title}`);
  for (const t of row.tier.split(",")) if (!KT_TIERS.includes(t)) throw new Error(`잘못된 tier: ${row.title} -> ${t}`);
}
if (new Set(ROWS.map((r) => r.title)).size !== ROWS.length) throw new Error("title 중복");

// ─── 적용 ────────────────────────────────────────────────────────────────
const { data: existing, error: loadError } = await supabase
  .from("benefits")
  .select("id, title, tier, is_active")
  .eq("carrier", CARRIER)
  .eq("source_url", SOURCE);
if (loadError) throw loadError;

const byTitle = new Map(existing.map((r) => [`${r.title}`, r]));
// 같은 title이 등급만 달리 여러 개(예: 밀리의서재 VIP/VVIP)일 수 있어 legacy 조회는 (title, tier)로 한다.
const byTitleTier = new Map(existing.map((r) => [`${r.title}|${r.tier}`, r]));
const usedIds = new Set();

const plan = [];
for (const row of ROWS) {
  // 1순위: 이미 새 title로 존재(재실행) 2순위: legacy (title, tier)
  let target = byTitle.get(row.title) && !usedIds.has(byTitle.get(row.title).id) ? byTitle.get(row.title) : null;
  if (!target && row.legacy) {
    const candidate = byTitleTier.get(`${row.legacy.title}|${row.legacy.tier}`);
    if (candidate && !usedIds.has(candidate.id)) target = candidate;
  }
  if (target) usedIds.add(target.id);
  plan.push({ row, target });
}

console.log(`${DRY_RUN ? "[DRY RUN] " : ""}KT 등급 혜택 재구성 — 새 구조 ${ROWS.length}개`);
for (const { row, target } of plan) {
  const action = target ? (target.title === row.title && target.tier === row.tier ? "UPDATE " : "REUSE  ") : "INSERT ";
  const from = target && (target.title !== row.title || target.tier !== row.tier) ? `  ← 기존 "${target.title}" [${target.tier}] 의 id 재사용` : "";
  console.log(`  ${action} [${row.tier === ALL ? "전 등급" : row.tier}] ${row.title}${from}`);
}

const retireTargets = RETIRE.map((r) => byTitleTier.get(`${r.title}|${r.tier}`)).filter((r) => r && r.is_active);
for (const r of retireTargets) console.log(`  RETIRE  [${r.tier}] ${r.title}  (is_active=false — 삭제하지 않음)`);

if (DRY_RUN) {
  console.log("\n(dry run — DB는 변경하지 않았습니다)");
} else {
  for (const { row, target } of plan) {
    // group/legacy는 이 스크립트 안에서만 쓰는 메타 정보라 DB 컬럼으로 보내지 않는다.
    const columns = Object.fromEntries(Object.entries(row).filter(([name]) => name !== "group" && name !== "legacy"));
    const payload = {
      ...columns,
      provider: CARRIER,
      carrier: CARRIER,
      persona_category: null,
      valid_from: null,
      valid_to: null,
      source_url: SOURCE,
      is_active: true,
    };
    const { error } = target
      ? await supabase.from("benefits").update(payload).eq("id", target.id)
      : await supabase.from("benefits").insert(payload);
    if (error) throw new Error(`${row.title}: ${error.message}`);
  }
  for (const r of retireTargets) {
    const { error } = await supabase.from("benefits").update({ is_active: false }).eq("id", r.id);
    if (error) throw new Error(`retire ${r.title}: ${error.message}`);
  }
  console.log("\n적용 완료.");
}

// ─── 검증: 등급별 집계 (적용 후 DB를 다시 읽어서 센다) ────────────────────
const { data: after, error: afterError } = await supabase
  .from("benefits")
  .select("title, tier, estimated_monthly_saving, is_active")
  .eq("carrier", CARRIER)
  .eq("is_active", true)
  .not("tier", "is", null);
if (afterError) throw afterError;

const groupOf = new Map(ROWS.filter((r) => r.group).map((r) => [r.title, r.group]));
const source = DRY_RUN ? ROWS.map((r) => ({ title: r.title, tier: r.tier, estimated_monthly_saving: r.estimated_monthly_saving })) : after;

console.log(`\n=== KT 등급별 혜택 집계 ${DRY_RUN ? "(새 구조 기준 예상)" : "(DB 기준)"} ===`);
console.log("등급    | 혜택 수 | 전 등급 공통 | VIP 이상 | VVIP 전용 | 예상 월 절감액 합 | 택1 반영 합");
const rows = [];
for (const tier of KT_TIERS) {
  const mine = source.filter((b) => tierMatches(b.tier, tier));
  const common = mine.filter((b) => b.tier === ALL).length;
  const vipUp = mine.filter((b) => b.tier === VIP_UP).length;
  const vvipOnly = mine.filter((b) => b.tier === VVIP_ONLY).length;
  const total = mine.reduce((s, b) => s + b.estimated_monthly_saving, 0);
  // 택1 묶음은 그 등급이 받을 수 있는 항목 중 최댓값 하나만 센다.
  const groups = new Map();
  let effective = 0;
  for (const b of mine) {
    const g = groupOf.get(b.title);
    if (g) groups.set(g, Math.max(groups.get(g) ?? 0, b.estimated_monthly_saving));
    else effective += b.estimated_monthly_saving;
  }
  for (const v of groups.values()) effective += v;
  rows.push({ tier, count: mine.length, total, effective });
  console.log(`${tier.padEnd(7)} | ${String(mine.length).padStart(6)} | ${String(common).padStart(11)} | ${String(vipUp).padStart(8)} | ${String(vvipOnly).padStart(9)} | ${String(total).padStart(15)}원 | ${String(effective).padStart(9)}원`);
}

const by = Object.fromEntries(rows.map((r) => [r.tier, r]));
const lower = ["GOLD", "SILVER", "WHITE", "일반"];
const commonCount = ROWS.filter((r) => r.tier === ALL).length;
console.log("\n=== 구조 검증 ===");
console.log(`전 등급 공통 행 수: ${commonCount}`);
console.log(`VVIP(${by.VVIP.count}) > VIP(${by.VIP.count}) > GOLD/SILVER/WHITE/일반(${lower.map((t) => by[t].count).join("/")}) : ${by.VVIP.count > by.VIP.count && by.VIP.count > by.GOLD.count ? "OK" : "FAIL"}`);
console.log(`VVIP 혜택 수 ${by.VVIP.count}개 (5개 이상 요구): ${by.VVIP.count >= 5 ? "OK" : "FAIL"}`);
console.log(`가치(택1 반영): VVIP ${by.VVIP.effective} > VIP ${by.VIP.effective} > 하위 ${by.GOLD.effective}: ${by.VVIP.effective > by.VIP.effective && by.VIP.effective > by.GOLD.effective ? "OK" : "FAIL"}`);
