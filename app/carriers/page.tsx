import type { Metadata } from "next";
import CarrierBenefitsBoard from "@/components/carriers/CarrierBenefitsBoard";
import CarrierHeroIllustration from "@/components/carriers/CarrierHeroIllustration";
import type { BenefitCatalogItem } from "@/components/carriers/types";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { isBenefitCategory } from "@/lib/carrierBenefitCategories";
import { getSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "통신사별 혜택 | 티모산",
  description: "SKT, KT, U+ 통신사별로 제공하는 다양한 할인 혜택을 등급별로 확인해보세요.",
};

// 카탈로그성 공개 데이터라 매 요청마다 새로 조회한다 (로그인 불필요, RLS의 public read 정책만 적용).
export const revalidate = 0;

interface BenefitRow {
  id: string;
  provider: string;
  carrier: string;
  tier: string | null;
  category: string | null;
  title: string;
  description: string | null;
  usage_condition: string | null;
  discount_type: string;
  discount_value: number | null;
  estimated_monthly_saving: number;
  valid_to: string | null;
}

async function loadBenefits(): Promise<{ items: BenefitCatalogItem[]; error: string | null }> {
  try {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("benefits")
      .select(
        "id, provider, carrier, tier, category, title, description, usage_condition, discount_type, discount_value, estimated_monthly_saving, valid_to",
      )
      .eq("is_active", true)
      .order("carrier", { ascending: true })
      .order("estimated_monthly_saving", { ascending: false });

    if (error) {
      console.error("[carriers] failed to load benefits", error);
      return { items: [], error: "혜택 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요." };
    }

    const rows = (data ?? []) as BenefitRow[];
    const items: BenefitCatalogItem[] = rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      carrier: row.carrier as BenefitCatalogItem["carrier"],
      tier: row.tier,
      category: isBenefitCategory(row.category) ? row.category : null,
      title: row.title,
      description: row.description,
      usageCondition: row.usage_condition,
      discountType: row.discount_type as BenefitCatalogItem["discountType"],
      discountValue: row.discount_value,
      estimatedMonthlySaving: row.estimated_monthly_saving,
      validTo: row.valid_to,
    }));

    return { items, error: null };
  } catch (error) {
    console.error("[carriers] unexpected error loading benefits", error);
    return { items: [], error: "혜택 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요." };
  }
}

export default async function CarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ benefit?: string }>;
}) {
  const { items, error } = await loadBenefits();
  const { benefit: benefitId } = await searchParams;
  // /diagnosis 결과 화면의 "혜택 자세히 보기" 딥링크 — 이미 로드된 카탈로그(items)에서 id로 찾아
  // 별도 조회 없이 상세 모달을 바로 연다.
  const initialDetailItem = benefitId ? (items.find((item) => item.id === benefitId) ?? null) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active="carriers" />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-50/60 to-white dark:from-primary-500/5 dark:to-zinc-950">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-bold text-primary-700 dark:text-primary-400">통신사별 할인 혜택 한눈에 보기</p>
              <h1 className="mt-3 text-2xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-3xl lg:text-[2.25rem] dark:text-zinc-50">
                SKT, KT, U+ 통신사별로
                <br />
                제공하는 다양한 할인 혜택을 확인해보세요.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
                통신사로 제공되는 멤버십 혜택과 제휴 할인을
                <br />
                등급별로 정리했어요. 내가 사용하는 통신사와 등급에 맞는 혜택을 찾아보세요.
              </p>
            </div>
            <CarrierHeroIllustration />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          {error ? (
            <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          ) : (
            <CarrierBenefitsBoard benefits={items} initialDetailItem={initialDetailItem} />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
