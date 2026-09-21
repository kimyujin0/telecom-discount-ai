#!/usr/bin/env node
// SKT·LG U+ 등급별 혜택(/carriers 페이지용, source_url='carrier-page-seed') 재구성 스크립트.
// KT(scripts/rebuild-kt-benefits.mjs)와 같은 방식 — "전 등급 공통" + "상위 등급 전용" 구조.
// 아래 구조는 요청자가 정리해 준 내용을 그대로 옮긴 것이며 코드에서 사실 여부를 검증하지 않는다.
//
// 사용법 (프로젝트 루트에서):
//   node --env-file=.env.local scripts/rebuild-skt-lgu-benefits.mjs --dry-run   # 계획만 출력
//   node --env-file=.env.local scripts/rebuild-skt-lgu-benefits.mjs             # 실제 적용
//   node --env-file=.env.local scripts/rebuild-skt-lgu-benefits.mjs --summary   # 적용 없이 3사 집계만 출력
//
// 멱등이다. 행을 지우지 않는다:
//   - 새 구조에 대응되는 기존 행은 같은 id로 제자리 수정한다(saved_benefits / diagnosis_result_benefits 가
//     benefit id를 참조하므로 지우면 FK 오류가 나거나 저장한 혜택이 사라진다).
//   - 대응이 없는 기존 행은 is_active=false 로 내린다(되돌리려면 true).
//   - tier 가 없는 demo-seed 행(진단 데모용)은 건드리지 않는다.
//
// estimated_monthly_saving 은 "예상 월 절감액"이다. 기존 DB 값이 있던 항목은 그대로 두고, 값이 없던 항목은
// 아래 주석에 "추정"으로 표시한 임시값이다 — 실제 금액을 알게 되면 고쳐야 한다.

import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SUMMARY_ONLY = args.includes("--summary");
const SOURCE = "carrier-page-seed";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (node --env-file=.env.local ...).");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const CATEGORIES = ["쇼핑", "외식", "카페", "영화/문화", "여행/레저", "통신/기타"];
const DISCOUNT_TYPES = ["percent", "fixed_amount", "coupon", "free_item"];

// lib/carrierTiers.ts 의 tierMatches 와 같은 규칙.
const tierMatches = (benefitTier, selected) =>
  benefitTier === "전체" || (benefitTier ?? "").split(/[,·/]/).map((t) => t.trim()).includes(selected);

// ─── SKT ─────────────────────────────────────────────────────────────────
const SKT_TIERS = ["VIP", "GOLD", "SILVER"]; // lib/carrierTiers.ts 와 동일해야 한다
const SKT_ALL = SKT_TIERS.join(",");
const SKT_LOW = "GOLD,SILVER";

// scope: "common" = 전 등급 공통(할인율만 등급별로 다른 행 포함), "upper" = 상위 등급 전용
// legacy: 이 행이 대체하는 기존 행 { title, tier } — 있으면 같은 id로 제자리 수정한다.
const skt = (title, tier, category, discount_type, discount_value, estimated_monthly_saving, usage_condition, description, extra = {}) => ({
  title, tier, category, discount_type, discount_value, estimated_monthly_saving, usage_condition, description, scope: "common", ...extra,
});

const SKT_ROWS = [
  // ══════ 전 등급 공통 — 할인율만 등급별 차등 (VIP 행 + GOLD·SILVER 행) ══════
  skt("메가MGC커피", "VIP", "카페", "percent", 20, 4500, "1일 1회", "메가MGC커피 20% 할인 (VIP)", { legacy: { title: "메가MGC커피", tier: "VIP" } }),
  skt("메가MGC커피", SKT_LOW, "카페", "percent", 10, 2500, "1일 1회", "메가MGC커피 10% 할인 (GOLD·SILVER)", { legacy: { title: "메가MGC커피", tier: "GOLD·SILVER" } }),
  skt("도미노피자", "VIP", "외식", "percent", 30, 9000, "1일 1회", "도미노피자 30% 할인 (VIP)", { legacy: { title: "도미노피자", tier: "VIP" } }),
  skt("도미노피자", SKT_LOW, "외식", "percent", 20, 6000, "1일 1회", "도미노피자 20% 할인 (GOLD·SILVER)", { legacy: { title: "도미노피자", tier: "GOLD·SILVER" } }),
  skt("배달의민족 처갓집양념치킨", "VIP", "외식", "fixed_amount", 8000, 8000, "1일 1회", "배달의민족 처갓집양념치킨 8천원 할인 (VIP)", { legacy: { title: "배달의민족 처갓집양념치킨", tier: "VIP" } }),
  skt("배달의민족 처갓집양념치킨", SKT_LOW, "외식", "fixed_amount", 6000, 6000, "1일 1회", "배달의민족 처갓집양념치킨 6천원 할인 (GOLD·SILVER)", { legacy: { title: "배달의민족 처갓집양념치킨", tier: "GOLD·SILVER" } }),
  skt("GS25 T.USE.DAY", SKT_ALL, "쇼핑", "percent", 20, 3000, "매주 화요일, 1000원당 200원 할인, 1일 1회 최대 2만원 한도", "GS25 T.USE.DAY — 화요일 1000원당 200원 할인 (전 등급)", { legacy: { title: "GS25 T.USE.DAY", tier: "전체" } }),
  skt("CU·세븐일레븐", "VIP,GOLD", "쇼핑", "percent", 10, 2000, "1000원당 100원 할인", "CU·세븐일레븐 1000원당 100원 할인 (VIP·GOLD)", { legacy: { title: "CU·세븐일레븐", tier: "VIP·GOLD" } }),
  skt("CU·세븐일레븐", "SILVER", "쇼핑", "percent", 5, 1000, "1000원당 50원 할인", "CU·세븐일레븐 1000원당 50원 할인 (SILVER)", { legacy: { title: "CU·세븐일레븐", tier: "SILVER" } }),
  // ══════ 전 등급 공통 — 등급 차등 없음 ══════
  skt("롯데시네마·메가박스", SKT_ALL, "영화/문화", "fixed_amount", 4000, 4000, "1.1만원 이상 예매 시 최대 4천원 할인", "롯데시네마·메가박스 최대 4천원 할인 (전 등급)", { legacy: { title: "롯데시네마·메가박스", tier: "전체" } }),
  skt("에버랜드·캐리비안베이", SKT_ALL, "여행/레저", "percent", 40, 15000, "본인 40% + 동반 3인 30% 할인", "에버랜드·캐리비안베이 본인 40% + 동반 3인 30% 할인 (전 등급)", { legacy: { title: "에버랜드·캐리비안베이", tier: "전체" } }),
  skt("비발디파크·롯데월드어드벤처", SKT_ALL, "여행/레저", "percent", 55, 10000 /* 추정 */, "최대 50~55% 할인", "비발디파크·롯데월드어드벤처 최대 50~55% 할인 (전 등급)"),
  skt("11번가·삼다수", SKT_ALL, "쇼핑", "percent", 10, 1000, "전 등급 적용", "11번가·삼다수 무라벨 생수 할인 (전 등급)", { legacy: { title: "삼다수 무라벨 생수", tier: "전체" } }),
  skt("T다이렉트샵", SKT_ALL, "통신/기타", "fixed_amount", 150000, 12500 /* 추정: 15만원 ÷ 12, 연 1회 이용 가정 */, "중고폰 반납 시 최대 15만원", "T다이렉트샵 중고폰 반납 시 최대 15만원 (전 등급)"),

  // ══════ VIP 전용 ══════
  skt("파리바게뜨 해피아워", "VIP", "외식", "fixed_amount", 4000, 4000, "20~24시, 1만원 이상 구매 시 4천원 할인", "파리바게뜨 해피아워 — 20~24시 1만원 이상 구매 시 4천원 할인 (VIP 전용)", { scope: "upper", legacy: { title: "파리바게뜨 해피아워", tier: "VIP" } }),
  skt("백미당 해피아워", "VIP", "카페", "percent", 50, 3000 /* 추정 */, "해피아워 시간대 한정", "백미당 해피아워 — 시그니처 메뉴 50% 할인 (VIP 전용)", { scope: "upper" }),
  skt("쉐이크쉑 해피아워", "VIP", "외식", "fixed_amount", 5000, 5000, "해피아워 시간대 한정", "쉐이크쉑 해피아워 — 베스트버거 5천원 할인 (VIP 전용)", { scope: "upper" }),
  skt("티스테이션 VIP PICK", "VIP", "통신/기타", "coupon", null, 3000 /* 추정 */, null, "티스테이션 VIP PICK — 타이어 정비 프로모션 (VIP 전용)", { scope: "upper" }),
];

// ─── LG U+ ───────────────────────────────────────────────────────────────
const LGU_TIERS = ["VVIP+", "VVIP", "VIP+", "VIP", "GOLD", "SILVER", "일반"]; // lib/carrierTiers.ts 의 "U+" 와 동일해야 한다
const LGU_ALL = LGU_TIERS.join(",");
const LGU_VIP_UP = "VVIP+,VVIP,VIP+,VIP"; // "나만의콕" — VIP 이상
const LGU_VVIP_UP = "VVIP+,VVIP";

const KOK_USAGE = "매월 택1 (라이프콕)";
const KOK_DESC = "나만의콕 라이프콕 — 매월 GS25/파리바게트/이니스프리/뚜레쥬르/쿠팡이츠/네이버/밀리의서재 중 택1";
const lifeKok = (name, estimated_monthly_saving, extra = {}) => ({
  title: `라이프콕-${name}`,
  tier: LGU_VIP_UP,
  category: "통신/기타",
  discount_type: "coupon",
  discount_value: null,
  estimated_monthly_saving,
  usage_condition: KOK_USAGE,
  description: `${KOK_DESC} · ${name}`,
  scope: "upper",
  group: "라이프콕",
  ...extra,
});

const LGU_ROWS = [
  // ══════ 전 등급 공통 (VVIP+ ~ 일반) ══════
  {
    title: "GS25·파리바게트 기본혜택", tier: LGU_ALL, category: "통신/기타", discount_type: "coupon", discount_value: null,
    estimated_monthly_saving: 1000, usage_condition: "전 등급 적용", description: "GS25·파리바게트 기본 혜택 (전 등급 공통)",
    scope: "common", legacy: { title: "GS25·파리바게트 기본혜택", tier: "전체" },
  },
  {
    title: "배달의민족X멕시카나치킨·다운타우너·오뚜기몰·사조몰", tier: LGU_ALL, category: "외식", discount_type: "coupon", discount_value: null,
    estimated_monthly_saving: 3000 /* 추정 */, usage_condition: "전 등급 적용", description: "배달의민족 X 멕시카나치킨·다운타우너, 오뚜기몰·사조몰 제휴 혜택 (전 등급 공통)",
    scope: "common",
  },
  {
    title: "현대면세점", tier: LGU_ALL, category: "여행/레저", discount_type: "percent", discount_value: 15,
    estimated_monthly_saving: 6000, usage_condition: "GOLD 등급 자동 부여, 최대 15% 할인", description: "현대면세점 GOLD 등급 자동 부여 + 최대 15% 할인 (전 등급 공통)",
    scope: "common", legacy: { title: "현대면세점", tier: "전체" },
  },

  // ══════ VIP 이상 전용 — 나만의콕 (VVIP+, VVIP, VIP+, VIP) ══════
  lifeKok("GS25", 3000 /* 추정 */),
  lifeKok("파리바게트", 3000 /* 추정 */),
  lifeKok("이니스프리", 3000 /* 추정 */),
  lifeKok("뚜레쥬르", 3000 /* 추정 */),
  lifeKok("쿠팡이츠", 3000 /* 추정 */),
  lifeKok("네이버", 3000 /* 추정 */),
  lifeKok("밀리의서재", 9900 /* KT 밀리의서재 1개월 무료와 같은 값(추정) */, { discount_type: "free_item" }),
  {
    title: "영화콕(CGV·롯데시네마·메가박스)", tier: LGU_VIP_UP, category: "영화/문화", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 26000 /* 추정: 1만3천원 × 연 24회 ÷ 12 */, usage_condition: "월 2회, 연 24회 무료",
    description: "나만의콕 영화콕 — CGV·롯데시네마·메가박스 월 2회·연 24회 무료 관람",
    scope: "upper", legacy: { title: "CGV VIP콕", tier: "VVIP+,VVIP,VIP+,VIP" },
  },
  {
    title: "교통콕(티머니)", tier: LGU_VIP_UP, category: "여행/레저", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 2000 /* 추정 */, usage_condition: "월 2회 무료 충전", description: "나만의콕 교통콕 — 티머니 월 2회 무료 충전",
    scope: "upper",
  },
  {
    title: "공차 VIP콕", tier: LGU_VIP_UP, category: "카페", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 5000, usage_condition: "월 1회", description: "나만의콕 공차 VIP콕 (VIP 이상)",
    scope: "upper", legacy: { title: "공차 VIP콕", tier: "VVIP·VIP" },
  },
  {
    title: "배민클럽 2개월 무료", tier: LGU_VIP_UP, category: "외식", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 4000 /* 추정 */, usage_condition: "2개월 무료", description: "나만의콕 배민클럽 2개월 무료 (VIP 이상)",
    scope: "upper",
  },
  {
    title: "G마켓", tier: LGU_VIP_UP, category: "쇼핑", discount_type: "fixed_amount", discount_value: 4000,
    estimated_monthly_saving: 8000, usage_condition: "4천원/회, 월 2회, 최대 8천원", description: "나만의콕 G마켓 최대 8천원 할인 (VIP 이상)",
    scope: "upper", legacy: { title: "G마켓", tier: "VVIP·VIP" },
  },
  {
    title: "비발디파크·아쿠아필드", tier: LGU_VIP_UP, category: "여행/레저", discount_type: "coupon", discount_value: null,
    estimated_monthly_saving: 5000 /* 추정 */, usage_condition: null, description: "나만의콕 비발디파크·아쿠아필드 혜택 (VIP 이상)",
    scope: "upper",
  },

  // ══════ 상위 등급 전용 카페 혜택 — 스타벅스(VIP → VVIP 업그레이드), 엔젤리너스(GOLD·SILVER → VVIP 업그레이드) ══════
  {
    title: "스타벅스", tier: "VIP+,VIP", category: "카페", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 1000, usage_condition: "월 1회, 더블사이즈업", description: "스타벅스 더블 사이즈업 (VIP). VVIP는 아메리카노 톨 무료로 업그레이드",
    scope: "upper", legacy: { title: "스타벅스", tier: "VIP" },
  },
  {
    title: "스타벅스", tier: LGU_VVIP_UP, category: "카페", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 4500, usage_condition: "월 1회, 아메리카노 톨 무료", description: "스타벅스 아메리카노 톨 무료 — VIP의 더블 사이즈업보다 업그레이드 (VVIP 전용)",
    scope: "upper", legacy: { title: "스타벅스", tier: "VVIP" },
  },
  {
    title: "엔젤리너스", tier: "GOLD", category: "카페", discount_type: "percent", discount_value: 50,
    estimated_monthly_saving: 2250 /* 추정: 아메리카노 4,500원의 50% */, usage_condition: null, description: "엔젤리너스 아메리카노 50% 할인 (GOLD). VVIP는 무료로 업그레이드",
    scope: "upper",
  },
  {
    title: "엔젤리너스", tier: "SILVER", category: "카페", discount_type: "percent", discount_value: 30,
    estimated_monthly_saving: 1350 /* 추정: 아메리카노 4,500원의 30% */, usage_condition: null, description: "엔젤리너스 아메리카노 30% 할인 (SILVER). VVIP는 무료로 업그레이드",
    scope: "upper",
  },
  {
    title: "엔젤리너스", tier: LGU_VVIP_UP, category: "카페", discount_type: "free_item", discount_value: null,
    estimated_monthly_saving: 4500 /* 추정: 아메리카노 4,500원 */, usage_condition: null, description: "엔젤리너스 아메리카노 무료 — GOLD 50%·SILVER 30% 할인보다 업그레이드 (VVIP 전용)",
    scope: "upper",
  },
];

// 새 구조에 대응이 없는 기존 행 — 삭제하지 않고 비활성화한다.
const LGU_RETIRE = [{ title: "메가박스", tier: "전체" }]; // 영화콕(CGV·롯데시네마·메가박스)에 통합

const CARRIERS = [
  { carrier: "SKT", provider: "SKT", tiers: SKT_TIERS, rows: SKT_ROWS, retire: [], allTier: SKT_ALL },
  { carrier: "U+", provider: "LG U+", tiers: LGU_TIERS, rows: LGU_ROWS, retire: LGU_RETIRE, allTier: LGU_ALL },
];

// ─── 사전 검증 ───────────────────────────────────────────────────────────
for (const { carrier, tiers, rows } of CARRIERS) {
  for (const row of rows) {
    if (!CATEGORIES.includes(row.category)) throw new Error(`[${carrier}] 잘못된 category: ${row.title} -> ${row.category}`);
    if (!DISCOUNT_TYPES.includes(row.discount_type)) throw new Error(`[${carrier}] 잘못된 discount_type: ${row.title}`);
    for (const t of row.tier.split(",")) if (!tiers.includes(t)) throw new Error(`[${carrier}] 잘못된 tier: ${row.title} -> ${t}`);
  }
  const keys = rows.map((r) => `${r.title}|${r.tier}`);
  if (new Set(keys).size !== keys.length) throw new Error(`[${carrier}] (title, tier) 중복`);
}

// ─── 적용 ────────────────────────────────────────────────────────────────
if (!SUMMARY_ONLY) {
  for (const { carrier, provider, rows, retire, allTier } of CARRIERS) {
    const { data: existing, error: loadError } = await supabase
      .from("benefits")
      .select("id, title, tier, is_active")
      .eq("carrier", carrier)
      .eq("source_url", SOURCE);
    if (loadError) throw loadError;

    // 같은 title이 등급만 달리 여러 개(예: 메가MGC커피 VIP / GOLD·SILVER)라 조회는 (title, tier)로 한다.
    const byTitleTier = new Map(existing.map((r) => [`${r.title}|${r.tier}`, r]));
    const usedIds = new Set();
    const plan = [];
    for (const row of rows) {
      // 1순위: 이미 새 (title, tier)로 존재(재실행) 2순위: legacy (title, tier)
      const pick = (k) => {
        const c = byTitleTier.get(k);
        return c && !usedIds.has(c.id) ? c : null;
      };
      const target = pick(`${row.title}|${row.tier}`) ?? (row.legacy ? pick(`${row.legacy.title}|${row.legacy.tier}`) : null);
      if (target) usedIds.add(target.id);
      plan.push({ row, target });
    }

    console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}${carrier} 등급 혜택 재구성 — 새 구조 ${rows.length}개`);
    for (const { row, target } of plan) {
      const same = target && target.title === row.title && target.tier === row.tier;
      const action = target ? (same ? "UPDATE " : "REUSE  ") : "INSERT ";
      const from = target && !same ? `  ← 기존 "${target.title}" [${target.tier}] 의 id 재사용` : "";
      console.log(`  ${action} [${row.tier === allTier ? "전 등급" : row.tier}] ${row.title}${from}`);
    }

    const retireTargets = retire.map((r) => byTitleTier.get(`${r.title}|${r.tier}`)).filter((r) => r && r.is_active);
    for (const r of retireTargets) console.log(`  RETIRE  [${r.tier}] ${r.title}  (is_active=false — 삭제하지 않음)`);

    // 새 구조에 매핑되지 않고 retire 목록에도 없는 기존 등급 행이 남으면 알려 준다(자동으로 건드리지 않는다).
    const claimed = new Set([...usedIds, ...retireTargets.map((r) => r.id)]);
    for (const r of existing) if (r.is_active && !claimed.has(r.id)) console.log(`  (주의) 새 구조에 없는 기존 행이 그대로 남음: [${r.tier}] ${r.title}`);

    if (DRY_RUN) continue;
    for (const { row, target } of plan) {
      // group/legacy/scope 는 이 스크립트 안에서만 쓰는 메타 정보라 DB 컬럼으로 보내지 않는다.
      const columns = Object.fromEntries(Object.entries(row).filter(([name]) => !["group", "legacy", "scope"].includes(name)));
      const payload = { ...columns, provider, carrier, persona_category: null, valid_from: null, valid_to: null, source_url: SOURCE, is_active: true };
      const { error } = target
        ? await supabase.from("benefits").update(payload).eq("id", target.id)
        : await supabase.from("benefits").insert(payload);
      if (error) throw new Error(`[${carrier}] ${row.title}: ${error.message}`);
    }
    for (const r of retireTargets) {
      const { error } = await supabase.from("benefits").update({ is_active: false }).eq("id", r.id);
      if (error) throw new Error(`[${carrier}] retire ${r.title}: ${error.message}`);
    }
    console.log(`  ${carrier} 적용 완료.`);
  }
  if (DRY_RUN) console.log("\n(dry run — DB는 변경하지 않았습니다)");
}

// ─── 검증: 3사 등급별 집계 (적용 후 DB를 다시 읽어서 센다) ─────────────────
// SKT·U+는 위 ROWS 의 scope/group 메타로, KT 는 rebuild-kt-benefits.mjs 의 구조(전 등급 공통 = 6개 등급 모두 / VIP 이상 / VVIP 전용)로 분류한다.
const KT_TIERS = ["VVIP", "VIP", "GOLD", "SILVER", "WHITE", "일반"];
const KT_ALL = KT_TIERS.join(",");
const KT_GROUPS = new Map([
  ...["메가MGC커피", "도미노피자", "파리바게뜨", "뚜레쥬르", "롯데시네마·메가박스 영화권", "SNOW 1개월", "CJ더마켓", "샐러디", "배달의민족"].map((n) => [`달달초이스-${n}`, "달달초이스"]),
  ["VIP초이스-밀리의서재", "VIP초이스"], ["VIP초이스-SNOW", "VIP초이스"], ["VIP초이스-ABC마트", "VIP초이스"],
  ["VVIP초이스-밀리의서재", "VVIP초이스"],
]);

const aggregateConfigs = [
  { carrier: "SKT", tiers: SKT_TIERS, scopeOf: (b) => (SKT_ROWS.find((r) => r.title === b.title && r.tier === b.tier)?.scope ?? "common"), groupOf: () => null },
  { carrier: "U+", tiers: LGU_TIERS, scopeOf: (b) => (LGU_ROWS.find((r) => r.title === b.title && r.tier === b.tier)?.scope ?? "common"), groupOf: (b) => (b.title.startsWith("라이프콕-") ? "라이프콕" : null) },
  { carrier: "KT", tiers: KT_TIERS, scopeOf: (b) => (b.tier === KT_ALL ? "common" : "upper"), groupOf: (b) => KT_GROUPS.get(b.title) ?? null },
];

const summary = {};
for (const { carrier, tiers, scopeOf, groupOf } of aggregateConfigs) {
  const { data, error } = await supabase
    .from("benefits")
    .select("title, tier, estimated_monthly_saving")
    .eq("carrier", carrier)
    .eq("source_url", SOURCE)
    .eq("is_active", true)
    .not("tier", "is", null);
  if (error) throw error;

  console.log(`\n=== ${carrier} 등급별 혜택 집계 (DB 기준, 활성 ${data.length}행) ===`);
  console.log("등급    | 혜택 수 | 공통 | 상위 전용 | 예상 월 절감액 합 | 택1 반영 합");
  const rows = [];
  for (const tier of tiers) {
    const mine = data.filter((b) => tierMatches(b.tier, tier));
    const common = mine.filter((b) => scopeOf(b) === "common").length;
    const total = mine.reduce((s, b) => s + b.estimated_monthly_saving, 0);
    const groups = new Map();
    let effective = 0;
    for (const b of mine) {
      const g = groupOf(b);
      if (g) groups.set(g, Math.max(groups.get(g) ?? 0, b.estimated_monthly_saving));
      else effective += b.estimated_monthly_saving;
    }
    for (const v of groups.values()) effective += v;
    rows.push({ tier, count: mine.length, total, effective });
    console.log(`${tier.padEnd(7)} | ${String(mine.length).padStart(6)} | ${String(common).padStart(4)} | ${String(mine.length - common).padStart(9)} | ${String(total).padStart(15)}원 | ${String(effective).padStart(9)}원`);
  }
  summary[carrier] = Object.fromEntries(rows.map((r) => [r.tier, r]));
}

const gt = (m, a, b, f) => m[a][f] > m[b][f];
console.log("\n=== 구조 검증 ===");
const s = summary.SKT, u = summary["U+"], k = summary.KT;
const yn = (v) => (v ? "OK" : "FAIL");
console.log(`SKT  개수: VIP ${s.VIP.count} > GOLD ${s.GOLD.count} ≈ SILVER ${s.SILVER.count} : ${yn(s.VIP.count > s.GOLD.count && s.GOLD.count === s.SILVER.count)}`);
console.log(`SKT  가치: VIP ${s.VIP.effective} > GOLD ${s.GOLD.effective} ≥ SILVER ${s.SILVER.effective} : ${yn(gt(s, "VIP", "GOLD", "effective") && s.GOLD.effective >= s.SILVER.effective)}`);
console.log(`U+   개수: VVIP ${u.VVIP.count} > VIP ${u.VIP.count} > GOLD ${u.GOLD.count} ≥ SILVER ${u.SILVER.count} > 일반 ${u.일반.count} : ${yn(u.VVIP.count > u.VIP.count && u.VIP.count > u.GOLD.count && u.GOLD.count >= u.SILVER.count && u.SILVER.count > u.일반.count)}`);
console.log(`U+   가치: VVIP ${u.VVIP.effective} > VIP ${u.VIP.effective} > GOLD ${u.GOLD.effective} > SILVER ${u.SILVER.effective} > 일반 ${u.일반.effective} : ${yn(gt(u, "VVIP", "VIP", "effective") && gt(u, "VIP", "GOLD", "effective") && gt(u, "GOLD", "SILVER", "effective") && gt(u, "SILVER", "일반", "effective"))}`);
console.log(`KT   개수: VVIP ${k.VVIP.count} > VIP ${k.VIP.count} > GOLD ${k.GOLD.count} : ${yn(k.VVIP.count > k.VIP.count && k.VIP.count > k.GOLD.count)}`);
