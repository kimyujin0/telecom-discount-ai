"use client";

import { ChevronRight, Crown } from "lucide-react";
import { BENEFIT_CATEGORIES, type BenefitCategory } from "@/lib/carrierBenefitCategories";

interface TierSidebarProps {
  tiers: string[];
  selectedTier: string;
  onSelectTier: (tier: string) => void;
  selectedCategories: BenefitCategory[];
  onToggleCategory: (category: BenefitCategory) => void;
}

export default function TierSidebar({
  tiers,
  selectedTier,
  onSelectTier,
  selectedCategories,
  onToggleCategory,
}: TierSidebarProps) {
  return (
    <aside className="space-y-6">
      <div>
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">등급별 혜택 보기</p>

        <div role="radiogroup" aria-label="등급 선택" className="mt-3 space-y-2">
          {tiers.map((tier) => {
            const isActive = tier === selectedTier;
            const isTopTier = tier.includes("VIP");
            return (
              <button
                key={tier}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onSelectTier(tier)}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? "border-primary-700 bg-primary-700 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-primary-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                  }`}
                >
                  {isTopTier ? <Crown className="h-3.5 w-3.5" /> : tier.charAt(0)}
                </span>
                {tier}
                <ChevronRight className={`ml-auto h-4 w-4 ${isActive ? "text-white/70" : "text-zinc-300 dark:text-zinc-600"}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">주요 혜택 카테고리</p>
        <div className="mt-3 space-y-2.5">
          {BENEFIT_CATEGORIES.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => onToggleCategory(category)}
                className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-700"
              />
              {category}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
