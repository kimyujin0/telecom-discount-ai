import type { BenefitCatalogItem } from "@/components/carriers/types";
import { isBenefitCategory } from "@/lib/carrierBenefitCategories";
import { getPersonaByKey } from "@/lib/chat/personas";

/** 혜택 카드/상세 모달에서 공통으로 쓰는 할인 정보 뱃지 문구. */
export function formatDiscount(item: Pick<BenefitCatalogItem, "discountType" | "discountValue">): string {
  switch (item.discountType) {
    case "percent":
      return `${item.discountValue ?? 0}% 할인`;
    case "fixed_amount":
      return `${(item.discountValue ?? 0).toLocaleString()}원 할인`;
    case "coupon":
      return "할인 쿠폰 제공";
    case "free_item":
      return "무료 혜택 제공";
    default:
      return "";
  }
}

/**
 * benefits.category는 실제 카테고리("영화/문화")이거나, 값이 없을 때 대신 쓰는 persona_category
 * 키("media_lover")일 수 있다 (app/api/diagnose/route.ts의 `category ?? persona_category` 폴백 참고).
 * 화면에는 항상 사람이 읽을 라벨로 보여준다.
 */
export function resolveCategoryLabel(category: string | null): string | null {
  if (!category) return null;
  if (isBenefitCategory(category)) return category;
  return getPersonaByKey(category)?.name ?? category;
}

export function formatValidTo(validTo: string | null): string | null {
  if (!validTo) return null;
  const [year, month, day] = validTo.split("-");
  return `${year}.${month}.${day}까지`;
}
