import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { NowAvailableItem } from "@/lib/nowAvailableBenefits";
import { CARRIER_LABELS, isCarrierKey } from "@/lib/carriers";
import { formatDiscount, resolveCategoryLabel } from "@/lib/formatBenefit";
import type { ViewerCarrierTier } from "@/lib/viewerCarrierTier";
import UseBenefitButton from "./UseBenefitButton";

/**
 * 마이페이지 상단 "지금 쓸 수 있는 혜택" — 혜택을 찾아보는 귀찮음을 없애는 게 목적이라, 사용자가
 * 아무것도 고르지 않아도(진단 결과나 가입 시 선택한 통신사를 그대로 써서) 바로 보여준다.
 *
 * items는 이미 app/mypage/page.tsx에서 lib/nowAvailableBenefits.ts로 "지금 사용 가능 + 이번 주기에
 * 아직 안 쓴" 것만 걸러서 정렬해 넘겨준다 — 여기서는 보여주기만 한다.
 */
export default function NowAvailableSection({
  userId,
  viewer,
  items,
}: {
  userId: string;
  viewer: ViewerCarrierTier;
  items: NowAvailableItem[];
}) {
  if (!viewer.carrier) {
    return (
      <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-zinc-700 dark:text-zinc-200">
          <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          지금 쓸 수 있는 혜택
        </h2>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          통신사를 아직 몰라서 추천해드릴 수 없어요. 진단을 받으면 통신사·등급에 맞는 혜택을 바로 보여드려요.
        </p>
        <Link
          href="/diagnosis/chat"
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
        >
          지금 진단하러 가기
        </Link>
      </section>
    );
  }

  const carrier = viewer.carrier; // 아래 콜백(.map) 안에서는 narrowing이 유지되지 않아 로컬 변수로 고정해둔다.
  const carrierLabel = CARRIER_LABELS[carrier];
  const basisLabel =
    viewer.source === "diagnosis"
      ? `최근 진단 결과 기준 · ${carrierLabel}${viewer.tier && viewer.tier !== "모름" ? ` ${viewer.tier}` : ""}`
      : `가입 시 선택한 통신사 기준 · ${carrierLabel}`;

  return (
    <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-zinc-700 dark:text-zinc-200">
          <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          지금 쓸 수 있는 혜택 {items.length > 0 && <span className="text-primary-700 dark:text-primary-400">{items.length}</span>}
        </h2>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{basisLabel}</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          지금 바로 쓸 수 있는 혜택이 없어요. 시간대·요일 조건이 있는 혜택은 조건에 맞는 시간에 다시 확인해보세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3" data-testid="now-available-list">
          {items.map((item) => {
            const categoryLabel = resolveCategoryLabel(item.category);
            return (
              <li
                key={item.benefitId}
                data-testid="now-available-card"
                data-benefit-id={item.benefitId}
                className={`rounded-2xl border p-4 ${
                  item.availability.justOpened
                    ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/10"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[11px] font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                      {CARRIER_LABELS[isCarrierKey(item.carrier) ? item.carrier : carrier]}
                    </span>
                    {categoryLabel && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {categoryLabel}
                      </span>
                    )}
                  </div>
                  {item.availability.justOpened ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      오늘 열림
                    </span>
                  ) : item.availability.label ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <Clock className="h-3.5 w-3.5" />
                      {item.availability.label}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.description}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="rounded-xl bg-primary-50 px-3 py-2 dark:bg-primary-500/10">
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatDiscount(item)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      예상 월 절감액 {item.estimatedMonthlySaving.toLocaleString()}원
                    </p>
                  </div>
                  <UseBenefitButton
                    userId={userId}
                    benefitId={item.benefitId}
                    amountDefault={item.estimatedMonthlySaving}
                    usedUp={false}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
