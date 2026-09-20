"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { formatTierLabel } from "@/lib/carrierTiers";
import { formatDiscount, formatValidTo } from "@/lib/formatBenefit";
import type { BenefitCatalogItem } from "./types";

export default function BenefitDetailModal({
  item,
  onClose,
}: {
  item: BenefitCatalogItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;
  const validToLabel = formatValidTo(item.validTo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} 상세`}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              {item.provider} · {formatTierLabel(item.carrier, item.tier)}
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {item.category && (
          <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {item.category}
          </span>
        )}

        {item.description && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.description}</p>
        )}
        {item.usageCondition && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">이용 조건</span> · {item.usageCondition}
          </p>
        )}

        <div className="mt-4 rounded-xl bg-primary-50 p-3 dark:bg-primary-500/10">
          <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatDiscount(item)}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            예상 월 절감액 {item.estimatedMonthlySaving.toLocaleString()}원
          </p>
        </div>

        {validToLabel && <p className="mt-2 text-right text-[11px] text-zinc-400 dark:text-zinc-500">{validToLabel}</p>}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-primary-700 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}
