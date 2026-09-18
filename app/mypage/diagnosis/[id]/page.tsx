import { ArrowLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { requireUser } from "@/lib/auth/session";
import { loadDiagnosisDetail } from "@/lib/diagnosisHistory";
import { formatDiscount, resolveCategoryLabel } from "@/lib/formatBenefit";
import { formatDate } from "@/lib/formatDate";

export const metadata: Metadata = {
  title: "진단 상세 | 티모산",
  description: "지난 진단에서 추천받은 페르소나와 혜택을 자세히 확인해보세요.",
};

// 로그인 사용자 + 진단 id별로 내용이 달라지므로 절대 캐싱하지 않는다.
export const dynamic = "force-dynamic";

export default async function DiagnosisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/mypage/diagnosis/${id}`);
  const detail = await loadDiagnosisDetail(user.id, id);

  // 존재하지 않거나 본인 소유가 아니면 둘 다 404로 처리한다 (남의 진단 id가 유효한지 구분되지 않게).
  if (!detail) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active="mypage" />

      <main className="flex-1 bg-gradient-to-b from-primary-50/60 to-white dark:from-primary-500/5 dark:to-zinc-950">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            마이페이지로
          </Link>

          <p className="mt-4 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {formatDate(detail.createdAt)}에 진단했어요.
          </p>

          {/* 페르소나 + 절감액 요약 */}
          <div className="mt-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="rounded-2xl bg-primary-50 p-5 text-center dark:bg-primary-500/10">
              <p className="inline-flex items-center gap-1.5 text-base font-extrabold text-primary-800 sm:text-lg dark:text-primary-200">
                <Sparkles className="h-4 w-4" />
                {detail.personaName}
              </p>
              <p className="mt-3 text-sm font-semibold text-primary-700 dark:text-primary-300">예상 연간 절약액</p>
              <p className="mt-1 text-3xl font-extrabold text-primary-700 sm:text-4xl dark:text-primary-300">
                약 {detail.totalYearlySaving.toLocaleString()}원
              </p>
              <p className="mt-1 text-xs text-primary-600/80 dark:text-primary-400/80">
                (월 약 {detail.totalMonthlySaving.toLocaleString()}원 절약) · 티끌 모아 태산!
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {detail.personaDescription}
            </p>
          </div>

          {/* 추천 혜택 전체 목록 */}
          <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
              추천 혜택 {detail.benefits.length > 0 && `(${detail.benefits.length}건)`}
            </h2>

            {detail.benefits.length === 0 ? (
              <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                매칭된 혜택이 없었어요.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {detail.benefits.map((benefit) => {
                  const categoryLabel = resolveCategoryLabel(benefit.category);
                  return (
                    <li
                      key={benefit.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {benefit.provider}
                        </span>
                        {categoryLabel && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {categoryLabel}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">{benefit.title}</p>

                      {benefit.description && (
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                          {benefit.description}
                        </p>
                      )}
                      {benefit.usageCondition && (
                        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">이용 조건</span> ·{" "}
                          {benefit.usageCondition}
                        </p>
                      )}

                      <div className="mt-3 rounded-xl bg-primary-50 p-3 dark:bg-primary-500/10">
                        <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
                          {formatDiscount(benefit)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          예상 월 절감액 {benefit.estimatedMonthlySaving.toLocaleString()}원
                        </p>
                      </div>

                      {benefit.reason ? (
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">추천 이유</span> ·{" "}
                          {benefit.reason}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                          이 진단은 추천 이유가 기록되기 전에 진행됐어요.
                        </p>
                      )}

                      <Link
                        href={`/carriers?benefit=${benefit.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:underline dark:text-primary-400"
                      >
                        혜택 자세히 보기 →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
