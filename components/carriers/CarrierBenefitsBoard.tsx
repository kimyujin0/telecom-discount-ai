"use client";

import { useMemo, useState } from "react";
import BenefitCard from "./BenefitCard";
import type { BenefitCatalogItem, CarrierKey } from "./types";

type TabValue = "all" | CarrierKey;

const CARRIER_TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "KT", label: "KT" },
  { value: "SKT", label: "SKT" },
  { value: "U+", label: "U+" },
  { value: "알뜰폰", label: "알뜰폰" },
];

export default function CarrierBenefitsBoard({ benefits }: { benefits: BenefitCatalogItem[] }) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const filtered = useMemo(
    () => (activeTab === "all" ? benefits : benefits.filter((item) => item.carrier === activeTab)),
    [benefits, activeTab],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="통신사 필터"
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800"
      >
        {CARRIER_TABS.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          아직 등록된 혜택이 없어요. 다른 통신사를 확인해보세요.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <BenefitCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
