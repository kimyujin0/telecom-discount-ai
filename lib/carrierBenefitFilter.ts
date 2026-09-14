import type { BenefitCatalogItem } from "@/components/carriers/types";
import type { BenefitCategory } from "./carrierBenefitCategories";
import { tierMatches } from "./carrierTiers";

export interface BenefitFilterState {
  carrier: string;
  tier: string;
  /** 빈 배열이면 카테고리 필터 없음(전체 표시). */
  categories: BenefitCategory[];
}

/**
 * 통신사 → 등급 → 카테고리 계단식 필터의 실제 판정 로직.
 * CarrierBenefitsBoard(클라이언트 컴포넌트)와 동일한 규칙을 순수 함수로 분리해두면,
 * DB/네트워크 없이도(Node에서 바로) "SKT+VIP+카페 → 메가MGC커피만" 같은 케이스를 검증할 수 있다.
 */
export function filterBenefits(
  items: BenefitCatalogItem[],
  { carrier, tier, categories }: BenefitFilterState,
): BenefitCatalogItem[] {
  return items.filter((item) => {
    if (item.carrier !== carrier) return false;
    if (!tierMatches(item.tier, tier)) return false;
    if (categories.length > 0 && (!item.category || !categories.includes(item.category))) return false;
    return true;
  });
}
