import type { BenefitCatalogItem } from "@/components/carriers/types";

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

export function formatValidTo(validTo: string | null): string | null {
  if (!validTo) return null;
  const [year, month, day] = validTo.split("-");
  return `${year}.${month}.${day}까지`;
}
