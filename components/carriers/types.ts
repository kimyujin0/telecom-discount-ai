import type { CarrierKey } from "@/lib/carriers";

export type DiscountType = "percent" | "fixed_amount" | "coupon" | "free_item";

export type { CarrierKey };

export interface BenefitCatalogItem {
  id: string;
  provider: string;
  carrier: CarrierKey;
  title: string;
  description: string | null;
  category: string;
  discountType: DiscountType;
  discountValue: number | null;
  estimatedMonthlySaving: number;
  validTo: string | null;
}
