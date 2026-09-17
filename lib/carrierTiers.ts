import type { CarrierKey } from "./carriers";

// /carriers 페이지의 계단식 필터(통신사 → 등급 → 카테고리) 중 "등급" 단계의 단일 소스(SSOT).
// 통신사마다 등급 체계가 전혀 다르므로, 통신사 탭을 바꾸면 이 목록을 기준으로 사이드바가
// 자동으로 다시 그려진다. supabase/migrations/0004_add_benefits_tier_category.sql 참고.
//
// 알뜰폰은 통신사 자체 멤버십 등급 체계가 없어(제휴 통신사 회선에 얹혀 쓰는 구조) 이 페이지의
// 대상에서 제외한다 — 히어로 탭도 목업과 동일하게 SKT/KT/U+ 3개만 노출한다.
export type TieredCarrierKey = Exclude<CarrierKey, "알뜰폰">;

export const TIERED_CARRIERS: TieredCarrierKey[] = ["SKT", "KT", "U+"];

export const CARRIER_TIERS: Record<TieredCarrierKey, string[]> = {
  SKT: ["VIP", "GOLD", "SILVER"],
  KT: ["VVIP", "VIP", "GOLD", "SILVER", "WHITE", "일반"],
  "U+": ["VVIP+", "VVIP", "VIP+", "VIP", "GOLD", "SILVER", "일반"],
};

export function isTieredCarrier(value: unknown): value is TieredCarrierKey {
  return typeof value === "string" && (TIERED_CARRIERS as string[]).includes(value);
}

/**
 * benefits.tier 컬럼은 한 혜택이 여러 등급에 공통 적용될 때 "GOLD·SILVER" 처럼 구분자로 묶어
 * 저장하거나("VVIP+,VVIP,VIP+,VIP"), 전 등급 적용이면 "전체"로 저장한다. 선택된 등급이 이
 * 범위에 포함되는지 판정하는 단일 로직 — 시드 데이터와 필터 UI 양쪽에서 이 함수만 신뢰한다.
 */
export function tierMatches(benefitTier: string | null | undefined, selectedTier: string): boolean {
  if (!benefitTier) return false;
  if (benefitTier === "전체") return true;
  return benefitTier
    .split(/[,·/]/)
    .map((t) => t.trim())
    .includes(selectedTier);
}

/**
 * 사용자가 자기 등급을 모를 때 쓰는 값. 진단 대화에서 "모름"이라고 답하면 등급 조건을 걸지 않고
 * 등급 무관 혜택까지 모두 추천한다. diagnosis_sessions.tier에도 이 값이 그대로 저장된다
 * (0007_add_diagnosis_sessions_tier.sql).
 */
export const TIER_UNKNOWN = "모름";

// 사용자가 한글/소문자로 말한 등급을 CARRIER_TIERS의 표기로 맞춘다.
// (CARRIER_TIERS는 영문 대문자 표기가 정본이고, benefits.tier도 그 표기로 저장되어 있다.)
const TIER_ALIASES: Record<string, string> = {
  브이아이피: "VIP",
  골드: "GOLD",
  실버: "SILVER",
  화이트: "WHITE",
  "VVIP+": "VVIP+",
  "VIP+": "VIP+",
  일반: "일반",
};

// "모름 / 몰라요 / 잘 모르겠어요 / 없어요" 처럼 등급을 모른다는 답변을 걸러내는 단서들.
const UNKNOWN_HINTS = ["모름", "몰라", "모르", "없어", "없음", "글쎄", "잘 모", "확인", "기억"];

/** 특정 통신사 등급 체계에 속하는 값인지 확인해 정본 표기로 돌려준다. 아니면 null. */
function canonicalTierOf(carrier: CarrierKey | null, candidate: string): string | null {
  const pools = carrier && isTieredCarrier(carrier) ? [CARRIER_TIERS[carrier]] : Object.values(CARRIER_TIERS);
  for (const pool of pools) {
    const hit = pool.find((tier) => tier.toUpperCase() === candidate.toUpperCase());
    if (hit) return hit;
  }
  return null;
}

/**
 * 진단 대화에서 뽑아낸 등급 문자열(자유 입력)을 저장/필터링에 쓸 값으로 정규화한다.
 *
 * 반환값
 *   - CARRIER_TIERS의 등급 문자열: 등급을 특정했음 -> 혜택 매칭에 등급 조건으로 사용
 *   - TIER_UNKNOWN("모름"): 사용자가 등급을 모른다고 답했음 -> 등급 조건 없이 매칭
 *   - null: 아직 등급 얘기가 나오지 않았거나 해석 불가 -> 다시 물어봐야 함
 */
export function normalizeTierInput(carrier: CarrierKey | null, raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  if (UNKNOWN_HINTS.some((hint) => value.includes(hint))) return TIER_UNKNOWN;
  if (value === TIER_UNKNOWN) return TIER_UNKNOWN;

  // 정확히 일치하는 등급을 먼저 찾고, 없으면 "VIP 등급이에요"처럼 문장에 섞인 경우를 훑는다.
  const direct = canonicalTierOf(carrier, value);
  if (direct) return direct;

  const alias = TIER_ALIASES[value];
  if (alias) return canonicalTierOf(carrier, alias) ?? alias;

  const upper = value.toUpperCase();
  const pool = carrier && isTieredCarrier(carrier) ? CARRIER_TIERS[carrier] : Object.values(CARRIER_TIERS).flat();
  // 긴 등급명("VVIP+")이 짧은 것("VIP")에 가려지지 않도록 길이 내림차순으로 확인한다.
  const embedded = [...pool].sort((a, b) => b.length - a.length).find((tier) => upper.includes(tier.toUpperCase()));
  if (embedded) return embedded;

  const aliasHit = Object.keys(TIER_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((korean) => value.includes(korean));
  if (aliasHit) return canonicalTierOf(carrier, TIER_ALIASES[aliasHit]) ?? TIER_ALIASES[aliasHit];

  return null;
}

/** 등급 질문에 붙일 빠른 선택지 — 해당 통신사의 등급 + "모름". */
export function tierQuickReplies(carrier: CarrierKey | null): string[] {
  const tiers = carrier && isTieredCarrier(carrier) ? CARRIER_TIERS[carrier] : ["VIP", "GOLD", "SILVER"];
  // 등급이 7단계인 U+까지 버튼으로 다 늘어놓으면 화면이 넘치므로 상위 몇 개만 노출하고 자유 입력을 유도한다.
  return [...tiers.slice(0, 4), TIER_UNKNOWN];
}
