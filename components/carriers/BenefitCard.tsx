import { ChevronRight, Tag } from "lucide-react";
import { BENEFIT_CATEGORY_ICONS } from "@/lib/carrierBenefitCategories";
import { formatDiscount } from "@/lib/formatBenefit";
import type { BenefitCatalogItem } from "./types";

export default function BenefitCard({
  item,
  onOpenDetail,
}: {
  item: BenefitCatalogItem;
  onOpenDetail: (item: BenefitCatalogItem) => void;
}) {
  const Icon = item.category ? BENEFIT_CATEGORY_ICONS[item.category] : Tag;

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
          <Icon className="h-5 w-5" />
        </span>
        {item.category && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {item.category}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-50">{item.title}</h3>

      {item.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
      )}
      {item.usageCondition && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">({item.usageCondition})</p>
      )}

      <div className="mt-4 flex flex-1 items-end justify-between gap-2">
        <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
          {formatDiscount(item)}
        </span>
        <button
          type="button"
          onClick={() => onOpenDetail(item)}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400"
        >
          내 혜택으로 보기
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
