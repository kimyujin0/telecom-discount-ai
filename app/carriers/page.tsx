import type { Metadata } from "next";
import CarrierBenefitsBoard from "@/components/carriers/CarrierBenefitsBoard";
import type { BenefitCatalogItem } from "@/components/carriers/types";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { getSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "통신사별 혜택 | AI 혜택진단",
  description: "KT, SKT, U+, 알뜰폰 통신사별 혜택을 한눈에 비교해보세요.",
};

// 카탈로그성 공개 데이터라 매 요청마다 새로 조회한다 (로그인 불필요, RLS의 public read 정책만 적용).
export const revalidate = 0;

interface BenefitRow {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  category: string;
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
        "id, provider, carrier, title, description, category, discount_type, discount_value, estimated_monthly_saving, valid_to",
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
      title: row.title,
      description: row.description,
      category: row.category,
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

export default async function CarriersPage() {
  const { items, error } = await loadBenefits();

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active="carriers" />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-4 sm:px-6 sm:pt-16">
          <p className="text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
            통신사별 혜택
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            KT, SKT, U+, 알뜰폰 혜택을 한눈에 비교해보세요
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base dark:text-zinc-400">
            로그인 없이도 자유롭게 둘러볼 수 있어요. 내게 맞는 혜택이 궁금하다면 AI 진단도 받아보세요.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          {error ? (
            <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          ) : (
            <CarrierBenefitsBoard benefits={items} />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
