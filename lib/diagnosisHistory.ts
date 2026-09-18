import { getSupabaseServerClient } from "@/lib/supabase/server";

// 마이페이지(/mypage, /mypage/diagnosis/[id])에서 로그인 사용자의 진단 이력을 읽는 서버 전용 조회 계층.
//
// diagnosis_*는 RLS deny-all이라(0001_init_schema.sql) anon 키로는 읽을 수 없다. 두 함수 모두
// service role 클라이언트로 조회하되, 반드시 diagnosis_sessions.user_id = 본인 id 조건을 걸어
// 남의 진단 이력이 섞이거나 URL의 id만 바꿔 남의 상세를 보는 일이 없게 한다.

export interface DiagnosisHistoryItem {
  id: string;
  personaName: string;
  totalMonthlySaving: number;
  totalYearlySaving: number;
  matchedBenefitCount: number;
  createdAt: string;
}

export interface DiagnosisBenefitDetail {
  id: string;
  rank: number;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  usageCondition: string | null;
  /** BENEFIT_CATEGORIES 값이거나(lib/carrierBenefitCategories.ts), category가 비어 persona_category로 대체된 경우 persona key. 화면에는 resolveCategoryLabel()을 거쳐 노출할 것. */
  category: string | null;
  discountType: "percent" | "fixed_amount" | "coupon" | "free_item";
  discountValue: number | null;
  estimatedMonthlySaving: number;
  /** 진단 시점 LLM 추천 이유 스냅샷(0009 마이그레이션). 그 이전 진단은 NULL. */
  reason: string | null;
}

export interface DiagnosisDetail {
  id: string;
  personaName: string;
  personaDescription: string;
  totalMonthlySaving: number;
  totalYearlySaving: number;
  createdAt: string;
  benefits: DiagnosisBenefitDetail[];
}

// personas!inner(name)/diagnosis_sessions!inner(user_id) 같은 to-one 임베드는 객체로 오지만, 생성된 DB
// 타입이 없어 추론이 배열로 잡히는 경우가 있어 둘 다 받는다 (app/mypage/page.tsx의 기존 패턴과 동일).
function unwrapToOne<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

/** 로그인 사용자의 진단 이력 전체를 최신순으로 반환한다. */
export async function loadDiagnosisHistory(userId: string): Promise<DiagnosisHistoryItem[]> {
  const supabase = getSupabaseServerClient();

  const { data: results, error } = await supabase
    .from("diagnosis_results")
    .select("id, created_at, personas!inner(name), diagnosis_sessions!inner(user_id)")
    .eq("diagnosis_sessions.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[diagnosisHistory] failed to load history", error);
    return [];
  }
  if (!results || results.length === 0) return [];

  const ids = results.map((r) => r.id as string);
  const { data: savingsRows, error: savingsError } = await supabase
    .from("diagnosis_result_savings")
    .select("diagnosis_result_id, total_monthly_saving, total_yearly_saving, matched_benefit_count")
    .in("diagnosis_result_id", ids);
  if (savingsError) console.error("[diagnosisHistory] failed to load savings", savingsError);

  const savingsById = new Map((savingsRows ?? []).map((row) => [row.diagnosis_result_id as string, row]));

  return results.map((row) => {
    const persona = unwrapToOne(row.personas as { name?: string } | { name?: string }[] | null);
    const savings = savingsById.get(row.id as string);
    return {
      id: row.id as string,
      personaName: persona?.name ?? "밸런스형",
      totalMonthlySaving: savings?.total_monthly_saving ?? 0,
      totalYearlySaving: savings?.total_yearly_saving ?? 0,
      matchedBenefitCount: savings?.matched_benefit_count ?? 0,
      createdAt: row.created_at as string,
    };
  });
}

/** 진단 상세 1건을 반환한다. 본인 소유가 아니거나 존재하지 않으면 null. */
export async function loadDiagnosisDetail(userId: string, diagnosisId: string): Promise<DiagnosisDetail | null> {
  const supabase = getSupabaseServerClient();

  const { data: result, error } = await supabase
    .from("diagnosis_results")
    .select("id, created_at, persona_description, personas!inner(name), diagnosis_sessions!inner(user_id)")
    .eq("id", diagnosisId)
    .eq("diagnosis_sessions.user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[diagnosisHistory] failed to load detail", error);
    return null;
  }
  if (!result) return null;

  const [{ data: savings, error: savingsError }, { data: benefitRows, error: benefitError }] = await Promise.all([
    supabase
      .from("diagnosis_result_savings")
      .select("total_monthly_saving, total_yearly_saving")
      .eq("diagnosis_result_id", diagnosisId)
      .maybeSingle(),
    supabase
      .from("diagnosis_result_benefits")
      .select(
        "id, rank, estimated_monthly_saving, reason, benefits!inner(provider, carrier, title, description, usage_condition, category, persona_category, discount_type, discount_value)",
      )
      .eq("diagnosis_result_id", diagnosisId)
      .order("rank", { ascending: true }),
  ]);

  if (savingsError) console.error("[diagnosisHistory] failed to load detail savings", savingsError);
  if (benefitError) console.error("[diagnosisHistory] failed to load detail benefits", benefitError);

  const persona = unwrapToOne(result.personas as { name?: string } | { name?: string }[] | null);

  interface BenefitJoin {
    provider: string;
    carrier: string;
    title: string;
    description: string | null;
    usage_condition: string | null;
    category: string | null;
    persona_category: string | null;
    discount_type: DiagnosisBenefitDetail["discountType"];
    discount_value: number | null;
  }

  const benefits: DiagnosisBenefitDetail[] = (benefitRows ?? []).map((row) => {
    const benefit = unwrapToOne(row.benefits as BenefitJoin | BenefitJoin[] | null);
    return {
      id: row.id as string,
      rank: row.rank as number,
      provider: benefit?.provider ?? "",
      carrier: benefit?.carrier ?? "",
      title: benefit?.title ?? "",
      description: benefit?.description ?? null,
      usageCondition: benefit?.usage_condition ?? null,
      category: benefit?.category ?? benefit?.persona_category ?? null,
      discountType: benefit?.discount_type ?? "fixed_amount",
      discountValue: benefit?.discount_value ?? null,
      estimatedMonthlySaving: row.estimated_monthly_saving as number,
      reason: (row.reason as string | null) ?? null,
    };
  });

  return {
    id: result.id as string,
    personaName: persona?.name ?? "밸런스형",
    personaDescription: result.persona_description as string,
    totalMonthlySaving: savings?.total_monthly_saving ?? 0,
    totalYearlySaving: savings?.total_yearly_saving ?? 0,
    createdAt: result.created_at as string,
    benefits,
  };
}
