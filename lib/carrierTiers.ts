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
