import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { CARRIER_LABELS, isCarrierKey } from "@/lib/carriers";
import { getDdayInfo, sortByUrgency, todayInSeoul, type DdayTone } from "@/lib/dday";
import { formatDiscount, formatValidTo, resolveCategoryLabel } from "@/lib/formatBenefit";
import type { SavedBenefitItem } from "@/lib/savedBenefits";
import UnsaveButton from "./UnsaveButton";

// D-day 배지 색: D-7 이상/상시/조건부 상시/마감은 회색, D-3~D-6 노란색, D-2 이하(당일 포함) 빨간색.
const BADGE_STYLES: Record<DdayTone, string> = {
  safe: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  none: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  conditional: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  expired: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

/** 마이페이지 "저장한 혜택" — 마감 임박(D-3 이하)이 맨 위, 마감된 혜택이 맨 아래. */
export default function SavedBenefitsSection({ userId, items }: { userId: string; items: SavedBenefitItem[] }) {
  // 마이페이지가 force-dynamic이라 요청마다 오늘 날짜를 새로 계산한다.
  const today = todayInSeoul();
  const sorted = sortByUrgency(items, today);
  const urgentCount = sorted.filter((item) => getDdayInfo(item.validTo, today).urgent).length;

  return (
    <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
          저장한 혜택 {items.length > 0 && <span className="text-primary-700 dark:text-primary-400">{items.length}</span>}
        </h2>
        {urgentCount > 0 && (
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">마감 임박 {urgentCount}건</p>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-8 text-center dark:bg-zinc-800/50">
          <Star className="mx-auto h-6 w-6 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">아직 저장한 혜택이 없어요.</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            진단 결과나 통신사별 비교에서 별(★)을 눌러 담아보세요.
          </p>
          <Link
            href="/carriers"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
          >
            혜택 둘러보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" data-testid="saved-benefits-list">
          {sorted.map((item) => {
            // 공백뿐인 조건은 배지(getDdayInfo)와 같은 기준으로 "없음" 취급해 빈 "이용 조건 ·" 줄이 남지 않게 한다.
            const usageCondition = item.usageCondition?.trim() || null;
            const dday = getDdayInfo(item.validTo, today, usageCondition);
            const carrierLabel = isCarrierKey(item.carrier) ? CARRIER_LABELS[item.carrier] : item.carrier;
            const categoryLabel = resolveCategoryLabel(item.category);
            const validToLabel = formatValidTo(item.validTo);

            return (
              <li
                key={item.benefitId}
                data-testid="saved-benefit-card"
                data-benefit-id={item.benefitId}
                className={`rounded-2xl border p-4 ${
                  dday.urgent
                    ? "border-red-200 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/10"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[11px] font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                      {carrierLabel}
                    </span>
                    {item.provider !== item.carrier && item.provider !== carrierLabel && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {item.provider}
                      </span>
                    )}
                    {categoryLabel && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {categoryLabel}
                      </span>
                    )}
                  </div>

                  <div className="-mt-1 -mr-1 flex shrink-0 items-center gap-1">
                    <span
                      data-testid="dday-badge"
                      data-tone={dday.tone}
                      className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${BADGE_STYLES[dday.tone]}`}
                    >
                      {dday.label}
                    </span>
                    <UnsaveButton userId={userId} benefitId={item.benefitId} />
                  </div>
                </div>

                <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.description}</p>
                )}
                {usageCondition && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">이용 조건</span> ·{" "}
                    {usageCondition}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="rounded-xl bg-primary-50 px-3 py-2 dark:bg-primary-500/10">
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatDiscount(item)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      예상 월 절감액 {item.estimatedMonthlySaving.toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-right">
                    {validToLabel && (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{validToLabel}</p>
                    )}
                    <Link
                      href={`/carriers?benefit=${item.benefitId}`}
                      className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:underline dark:text-primary-400"
                    >
                      혜택 자세히 보기
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
