import { Coffee, Film, Plane, ShoppingBag, Smartphone, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// /carriers 페이지 계단식 필터의 "카테고리" 단계 단일 소스(SSOT).
// benefits.category 컬럼의 체크 제약과 반드시 동일해야 한다.
// 참고: supabase/migrations/0004_add_benefits_tier_category.sql
export const BENEFIT_CATEGORIES = ["쇼핑", "외식", "카페", "영화/문화", "여행/레저", "통신/기타"] as const;

export type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number];

export function isBenefitCategory(value: unknown): value is BenefitCategory {
  return typeof value === "string" && (BENEFIT_CATEGORIES as readonly string[]).includes(value);
}

export const BENEFIT_CATEGORY_ICONS: Record<BenefitCategory, LucideIcon> = {
  쇼핑: ShoppingBag,
  외식: Utensils,
  카페: Coffee,
  "영화/문화": Film,
  "여행/레저": Plane,
  "통신/기타": Smartphone,
};
