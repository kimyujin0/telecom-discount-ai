"use client";

import { ChevronRight } from "lucide-react";
import { TIERED_CARRIERS, type TieredCarrierKey } from "@/lib/carrierTiers";

const CARRIER_META: Record<TieredCarrierKey, { label: string; logoText: string; logoClass: string }> = {
  SKT: { label: "SKT", logoText: "T", logoClass: "bg-red-500 text-white" },
  KT: { label: "KT", logoText: "kt", logoClass: "border border-zinc-200 bg-white text-zinc-900" },
  "U+": { label: "U+", logoText: "U+", logoClass: "bg-fuchsia-600 text-white" },
};

interface CarrierTabsProps {
  value: TieredCarrierKey;
  onChange: (carrier: TieredCarrierKey) => void;
}

export default function CarrierTabs({ value, onChange }: CarrierTabsProps) {
  return (
    <div role="tablist" aria-label="통신사 선택" className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      {TIERED_CARRIERS.map((carrier) => {
        const isActive = carrier === value;
        const meta = CARRIER_META[carrier];
        return (
          <button
            key={carrier}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(carrier)}
            className={`flex flex-1 items-center gap-3 rounded-2xl border px-5 py-4 text-left transition ${
              isActive
                ? "border-primary-700 bg-primary-700 text-white shadow-md"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${meta.logoClass}`}
            >
              {meta.logoText}
            </span>
            <span className="flex-1 text-base font-bold">{meta.label}</span>
            <ChevronRight className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
          </button>
        );
      })}
    </div>
  );
}
