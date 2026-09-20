import type { DiscountType } from "@/components/carriers/types";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";

// 마이페이지 "저장한 혜택" 목록을 읽는 서버 전용 조회 계층.
//
// diagnosisHistory.ts와 달리 service role이 아니라 "로그인 사용자 세션" 클라이언트를 쓴다 —
// saved_benefits는 RLS로 본인 행만 보이고(0010_create_saved_benefits.sql), benefits는 공개 읽기(is_active)
// 정책이라 비활성화된 혜택은 inner join에서 자연스럽게 빠진다(카탈로그에서 내려간 혜택은 저장함에서도 숨김).

export interface SavedBenefitItem {
  benefitId: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  usageCondition: string | null;
  /** BENEFIT_CATEGORIES 값이거나 null. */
  category: string | null;
  discountType: DiscountType;
  discountValue: number | null;
  estimatedMonthlySaving: number;
  /** 마감일(YYYY-MM-DD). 상시 혜택은 null. */
  validTo: string | null;
  /** 저장한 시각(ISO). */
  savedAt: string;
}

interface BenefitJoin {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  usage_condition: string | null;
  category: string | null;
  discount_type: DiscountType;
  discount_value: number | null;
  estimated_monthly_saving: number;
  valid_to: string | null;
}

/** 로그인 사용자가 저장한 혜택 전체(정렬 전). 정렬은 lib/dday.ts의 sortByUrgency()가 맡는다. */
export async function loadSavedBenefits(userId: string): Promise<SavedBenefitItem[]> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase
      .from("saved_benefits")
      .select(
        "created_at, benefits!inner(id, provider, carrier, title, description, usage_condition, category, discount_type, discount_value, estimated_monthly_saving, valid_to)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // 0010 마이그레이션 미적용 등 — 저장함만 비어 보이고 마이페이지의 나머지는 정상 동작해야 한다.
      console.error("[savedBenefits] failed to load saved benefits", error);
      return [];
    }

    const items: SavedBenefitItem[] = [];
    for (const row of data ?? []) {
      // to-one 임베드는 객체로 오지만, 생성된 DB 타입이 없어 추론이 배열로 잡히는 경우가 있어 둘 다 받는다.
      const embedded = row.benefits as BenefitJoin | BenefitJoin[] | null;
      const benefit = Array.isArray(embedded) ? embedded[0] : embedded;
      if (!benefit) continue;

      items.push({
        benefitId: benefit.id,
        provider: benefit.provider,
        carrier: benefit.carrier,
        title: benefit.title,
        description: benefit.description,
        usageCondition: benefit.usage_condition,
        category: benefit.category,
        discountType: benefit.discount_type,
        discountValue: benefit.discount_value,
        estimatedMonthlySaving: benefit.estimated_monthly_saving,
        validTo: benefit.valid_to,
        savedAt: row.created_at as string,
      });
    }
    return items;
  } catch (error) {
    console.error("[savedBenefits] unexpected error loading saved benefits", error);
    return [];
  }
}
