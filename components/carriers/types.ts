import type { BenefitCategory } from "@/lib/carrierBenefitCategories";
import type { CarrierKey } from "@/lib/carriers";

export type DiscountType = "percent" | "fixed_amount" | "coupon" | "free_item";

export type { CarrierKey };

export interface BenefitCatalogItem {
  id: string;
  provider: string;
  carrier: CarrierKey;
  /** 통신사별 등급 문자열. "GOLD·SILVER"처럼 여러 등급을 묶거나 "전체"(전 등급)일 수 있다. */
  tier: string | null;
  /** /carriers 페이지 카테고리 필터 전용 (진단 매칭용 persona_category와는 다른 축). */
  category: BenefitCategory | null;
  title: string;
  description: string | null;
  usageCondition: string | null;
  discountType: DiscountType;
  discountValue: number | null;
  estimatedMonthlySaving: number;
  validTo: string | null;
}
