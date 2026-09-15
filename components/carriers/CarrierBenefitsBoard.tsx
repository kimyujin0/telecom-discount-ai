"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { filterBenefits } from "@/lib/carrierBenefitFilter";
import type { BenefitCategory } from "@/lib/carrierBenefitCategories";
import { CARRIER_TIERS, isTieredCarrier, type TieredCarrierKey } from "@/lib/carrierTiers";
import BenefitCard from "./BenefitCard";
import BenefitDetailModal from "./BenefitDetailModal";
import CarrierTabs from "./CarrierTabs";
import TierSidebar from "./TierSidebar";
import type { BenefitCatalogItem } from "./types";

export default function CarrierBenefitsBoard({
  benefits,
  initialDetailItem = null,
}: {
  benefits: BenefitCatalogItem[];
  /** /diagnosis 결과 화면 등에서 특정 혜택으로 바로 진입할 때(예: ?benefit=id) 상세 모달을 즉시 연다. */
  initialDetailItem?: BenefitCatalogItem | null;
}) {
  const initialCarrier: TieredCarrierKey =
    initialDetailItem && isTieredCarrier(initialDetailItem.carrier) ? initialDetailItem.carrier : "SKT";
  const [carrier, setCarrier] = useState<TieredCarrierKey>(initialCarrier);
  const [tier, setTier] = useState<string>(CARRIER_TIERS[initialCarrier][0]);
  const [categories, setCategories] = useState<BenefitCategory[]>([]);
  const [detailItem, setDetailItem] = useState<BenefitCatalogItem | null>(initialDetailItem);

  const handleCarrierChange = (next: TieredCarrierKey) => {
    setCarrier(next);
    setTier(CARRIER_TIERS[next][0]);
  };

  const toggleCategory = (category: BenefitCategory) => {
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const filtered = useMemo(
    () => filterBenefits(benefits, { carrier, tier, categories }),
    [benefits, carrier, tier, categories],
  );

  return (
    <div>
      <CarrierTabs value={carrier} onChange={handleCarrierChange} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <TierSidebar
          tiers={CARRIER_TIERS[carrier]}
          selectedTier={tier}
          onSelectTier={setTier}
          selectedCategories={categories}
          onToggleCategory={toggleCategory}
        />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {carrier} {tier} 등급의 주요 혜택
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {carrier} {tier} 고객을 위한 제휴 혜택을 확인해보세요.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                혜택 수 <span className="font-bold text-primary-700 dark:text-primary-400">{filtered.length}개</span>
              </span>
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCategories([])}
                  className="font-semibold text-zinc-400 transition hover:text-primary-700 dark:hover:text-primary-400"
                >
                  전체 혜택 보기
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
              선택한 등급·카테고리에 맞는 혜택이 아직 없어요. 다른 조건을 선택해보세요.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((item) => (
                <BenefitCard key={item.id} item={item} onOpenDetail={setDetailItem} />
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <Info className="h-4 w-4 shrink-0" />
            등급별 혜택은 통신사 정책에 따라 변경될 수 있습니다. 자세한 내용은 각 통신사 홈페이지에서 확인하세요.
          </div>
        </div>
      </div>

      <BenefitDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
