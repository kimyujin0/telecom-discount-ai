import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiagnosisSlots } from "./chat/slots";

// 슬롯 기반 혜택 매칭 — 기존 benefits 스키마(persona_category, category)만으로 구현한다.
// (별도 태그 컬럼을 새로 추가하는 편이 더 정교하지만, 이 환경에서는 원격 Supabase 프로젝트에
// DDL 마이그레이션을 적용할 수단이 없어(— 로컬 Docker 없음, `supabase login` 토큰 없음) 기존 컬럼만으로 구현했다.)
//
// 매핑 근거:
//   - ottUsage="있음"      -> persona_category='media_lover'   (OTT/미디어 구독 결합 혜택 묶음)
//   - ottUsage="없음"      -> title에 "구독 서비스"가 포함된 혜택 (예: 구독 서비스 자유 이용권)
//   - overseasUsage 자주/가끔 -> persona_category='travel_nomad' (로밍/공항/면세점/항공권 등)
//   - dataUsage(값 있음)    -> persona_category in (practical_living, balance) (요금제 최적화/결합 혜택)
//   - interestCategories   -> category 컬럼 직접 매칭 (/carriers 카탈로그 데이터)
// 여러 조건에 동시에 걸리는 혜택은 하나로 합치고(dedupe), 예상 월 절감액 내림차순으로 정렬해 상위 N개만 추천한다.

export interface MatchedBenefitRow {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  category: string | null;
  persona_category: string | null;
  estimated_monthly_saving: number;
  discount_type: string;
  discount_value: number | null;
}

const MATCH_COLUMNS =
  "id, provider, carrier, title, description, category, persona_category, estimated_monthly_saving, discount_type, discount_value";

const MAX_MATCHED_BENEFITS = 6;

export async function matchBenefitsForSlots(
  supabase: SupabaseClient,
  slots: DiagnosisSlots,
): Promise<MatchedBenefitRow[]> {
  const queries: PromiseLike<{ data: MatchedBenefitRow[] | null; error: unknown }>[] = [];

  if (slots.ottUsage === "있음") {
    queries.push(
      supabase.from("benefits").select(MATCH_COLUMNS).eq("is_active", true).eq("persona_category", "media_lover"),
    );
  } else if (slots.ottUsage === "없음") {
    queries.push(
      supabase.from("benefits").select(MATCH_COLUMNS).eq("is_active", true).ilike("title", "%구독 서비스%"),
    );
  }

  if (slots.overseasUsage === "자주" || slots.overseasUsage === "가끔") {
    queries.push(
      supabase.from("benefits").select(MATCH_COLUMNS).eq("is_active", true).eq("persona_category", "travel_nomad"),
    );
  }

  if (slots.dataUsage) {
    queries.push(
      supabase
        .from("benefits")
        .select(MATCH_COLUMNS)
        .eq("is_active", true)
        .in("persona_category", ["practical_living", "balance"]),
    );
  }

  if (slots.interestCategories.length > 0) {
    queries.push(
      supabase.from("benefits").select(MATCH_COLUMNS).eq("is_active", true).in("category", slots.interestCategories),
    );
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
      if (!seen.has(row.id)) seen.set(row.id, row);
    }
  }

  return [...seen.values()]
    .sort((a, b) => b.estimated_monthly_saving - a.estimated_monthly_saving)
    .slice(0, MAX_MATCHED_BENEFITS);
}
