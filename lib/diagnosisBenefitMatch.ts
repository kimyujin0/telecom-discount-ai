import type { SupabaseClient } from "@supabase/supabase-js";
import { TIER_UNKNOWN, tierMatches } from "./carrierTiers";
import type { DiagnosisSlots } from "./chat/slots";

// 슬롯 기반 혜택 매칭 — 기존 benefits 스키마(persona_category, category, carrier, tier)만으로 구현한다.
//
// 매핑 근거:
//   - ottUsage="있음"      -> persona_category='media_lover'   (OTT/미디어 구독 결합 혜택 묶음)
//   - ottUsage="없음"      -> title에 "구독 서비스"가 포함된 혜택 (예: 구독 서비스 자유 이용권)
//   - overseasUsage 자주/가끔 -> persona_category='travel_nomad' (로밍/공항/면세점/항공권 등)
//   - dataUsage(값 있음)    -> persona_category in (practical_living, balance) (요금제 최적화/결합 혜택)
//   - interestCategories   -> category 컬럼 직접 매칭 (/carriers 카탈로그 데이터)
// 여러 조건에 동시에 걸리는 혜택은 하나로 합치고(dedupe), 예상 월 절감액 내림차순으로 정렬해 상위 N개만 추천한다.
//
// 그 위에 통신사/등급 조건을 덮어씌운다:
//   - carrier 슬롯이 있으면 모든 쿼리에 carrier 조건을 걸어 다른 통신사 혜택이 섞이지 않게 한다.
//     (사용자가 가입하지도 않은 통신사의 혜택을 추천하면 절감액 합산이 의미가 없어진다.)
//   - tier 슬롯이 구체적인 등급이면 그 등급이 받을 수 없는 혜택을 걸러낸다. 판정은 tierMatches().

export interface MatchedBenefitRow {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  category: string | null;
  persona_category: string | null;
  tier: string | null;
  estimated_monthly_saving: number;
  discount_type: string;
  discount_value: number | null;
}

const MATCH_COLUMNS =
  "id, provider, carrier, title, description, category, persona_category, tier, estimated_monthly_saving, discount_type, discount_value";

const MAX_MATCHED_BENEFITS = 6;

/**
 * 선택된 등급이 이 혜택을 받을 수 있는지 판정한다.
 *
 * benefits.tier가 NULL인 행은 등급 개념이 없는 진단용 시드 데이터(supabase/seed.sql의 demo-seed —
 * 요금제 결합/캐시백 등 멤버십 등급과 무관한 혜택)라서 등급 조건에서 제외하지 않고 그대로 통과시킨다.
 * 등급 값이 있는 행(carrier-page-seed)만 tierMatches()로 걸러낸다.
 */
function tierAllows(benefitTier: string | null, selectedTier: string | null): boolean {
  if (benefitTier === null) return true;
  // 등급을 모른다고 답한 경우엔 등급 조건을 걸지 않는다 (잘못 걸러내 빈 결과를 주는 쪽이 더 나쁘다).
  if (selectedTier === null || selectedTier === TIER_UNKNOWN) return true;
  return tierMatches(benefitTier, selectedTier);
}

export async function matchBenefitsForSlots(
  supabase: SupabaseClient,
  slots: DiagnosisSlots,
): Promise<MatchedBenefitRow[]> {
  // 활성 혜택 + (통신사가 확인되었다면) 해당 통신사 조건까지 걸어둔 공통 기본 쿼리.
  const baseQuery = () => {
    const query = supabase.from("benefits").select(MATCH_COLUMNS).eq("is_active", true);
    return slots.carrier ? query.eq("carrier", slots.carrier) : query;
  };

  const queries: PromiseLike<{ data: MatchedBenefitRow[] | null; error: unknown }>[] = [];

  if (slots.ottUsage === "있음") {
    queries.push(baseQuery().eq("persona_category", "media_lover"));
  } else if (slots.ottUsage === "없음") {
    queries.push(baseQuery().ilike("title", "%구독 서비스%"));
  }

  if (slots.overseasUsage === "자주" || slots.overseasUsage === "가끔") {
    queries.push(baseQuery().eq("persona_category", "travel_nomad"));
  }

  if (slots.dataUsage) {
    queries.push(baseQuery().in("persona_category", ["practical_living", "balance"]));
  }

  if (slots.interestCategories.length > 0) {
    queries.push(baseQuery().in("category", slots.interestCategories));
  }

  if (queries.length === 0) return [];

  const results = await Promise.all(queries);

  const seen = new Map<string, MatchedBenefitRow>();
  for (const result of results) {
    if (result.error) {
      console.error("[diagnosisBenefitMatch] query failed", result.error);
      continue;
    }
    for (const row of result.data ?? []) {
      if (!seen.has(row.id) && tierAllows(row.tier, slots.tier)) seen.set(row.id, row);
    }
  }

  return [...seen.values()]
    .sort((a, b) => b.estimated_monthly_saving - a.estimated_monthly_saving)
    .slice(0, MAX_MATCHED_BENEFITS);
}
