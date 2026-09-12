import { getPersonaByKey } from "@/lib/chat/personas";
import type { BenefitCatalogItem } from "./types";

function formatDiscount(item: BenefitCatalogItem): string {
  switch (item.discountType) {
    case "percent":
      return `${item.discountValue ?? 0}% 할인`;
    case "fixed_amount":
      return `${(item.discountValue ?? 0).toLocaleString()}원 할인`;
    case "coupon":
      return "할인 쿠폰 제공";
    case "free_item":
      return "무료 혜택 제공";
    default:
      return "";
  }
}

function formatValidTo(validTo: string | null): string | null {
  if (!validTo) return null;
  const [year, month, day] = validTo.split("-");
  return `${year}.${month}.${day}까지`;
}

export default function BenefitCard({ item }: { item: BenefitCatalogItem }) {
  const categoryName = getPersonaByKey(item.category)?.name ?? item.category;
  const validToLabel = formatValidTo(item.validTo);

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {item.provider}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {categoryName}
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-50">{item.title}</h3>

      {item.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {item.description}
        </p>
      )}

      <div className="mt-4 flex-1 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatDiscount(item)}</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          예상 월 절감액 {item.estimatedMonthlySaving.toLocaleString()}원
        </p>
      </div>

      {validToLabel && (
        <p className="mt-3 text-right text-[11px] text-zinc-400 dark:text-zinc-500">{validToLabel}</p>
      )}
    </div>
  );
}
