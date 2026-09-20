"use client";

import { ChevronDown, PartyPopper, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SaveBenefitButton from "@/components/saved/SaveBenefitButton";
import { buildLoginPathForDiagnosis } from "@/lib/diagnosis/resume";
import { useSavedBenefits } from "@/lib/saved/useSavedBenefits";

export interface DiagnosisResultBenefit {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  category: string | null;
  estimatedMonthlySaving: number;
  /** 진단 당시 추천 이유. 저장돼 있지 않은 옛 진단을 복원할 때는 빈 문자열일 수 있다. */
  reason: string;
}

export interface DiagnosisResultData {
  personaTagline: string;
  totalMonthlySaving: number;
  totalYearlySaving: number;
  benefits: DiagnosisResultBenefit[];
}

export default function DiagnosisResult({
  result,
  sessionId,
  onRestart,
}: {
  result: DiagnosisResultData;
  /** 이 결과의 진단 세션 id. 비로그인으로 저장하려 할 때 로그인 후 이 결과로 돌아오는 링크에 실린다. */
  sessionId: string | null;
  onRestart: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(result.benefits[0]?.id ?? null);
  const saver = useSavedBenefits();
  // 비로그인 상태에서 저장을 누르면 이 결과의 세션 id를 next로 실어 로그인 페이지로 보낸다.
  // 로그인하면 /diagnosis/chat?session=<id> 로 돌아와 재진단 없이 같은 결과가 다시 보인다.
  const loginHref = sessionId ? buildLoginPathForDiagnosis(sessionId) : undefined;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          <PartyPopper className="h-4.5 w-4.5" />
        </span>
        <p className="text-lg font-extrabold text-zinc-900 sm:text-xl dark:text-zinc-50">
          당신에게 맞는 혜택을 찾았어요!
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-primary-50 p-5 text-center dark:bg-primary-500/10">
        {result.personaTagline && (
          <p className="text-base font-extrabold text-primary-800 sm:text-lg dark:text-primary-200">
            {result.personaTagline}
          </p>
        )}
        <p className="mt-3 text-sm font-semibold text-primary-700 dark:text-primary-300">예상 연간 절약액</p>
        <p className="mt-1 text-3xl font-extrabold text-primary-700 sm:text-4xl dark:text-primary-300">
          약 {result.totalYearlySaving.toLocaleString()}원
        </p>
        <p className="mt-1 text-xs text-primary-600/80 dark:text-primary-400/80">
          (월 약 {result.totalMonthlySaving.toLocaleString()}원 절약) · 티끌 모아 태산!
        </p>
      </div>

      {result.benefits.length === 0 ? (
        <p className="mt-6 rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          조건에 딱 맞는 혜택을 아직 찾지 못했어요. 다시 진단하며 조금 더 이야기해주시면 더 정확히 찾아드릴게요.
        </p>
      ) : (
        <div className="mt-6 space-y-2.5">
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">추천 혜택</p>
          {result.benefits.map((benefit) => {
            const isExpanded = expandedId === benefit.id;
            return (
              <div
                key={benefit.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* 저장 버튼은 <button> 안에 중첩할 수 없어서, 펼치기 버튼과 나란히 두는 형제 요소로 뺐다. */}
                <div className="flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : benefit.id)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 pl-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        <span className="mr-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {benefit.provider}
                        </span>
                        {benefit.title}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-primary-600 dark:text-primary-400">
                        월 {benefit.estimatedMonthlySaving.toLocaleString()}원 절약
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  <SaveBenefitButton benefitId={benefit.id} saver={saver} loginHref={loginHref} />
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-100 px-4 py-3.5 dark:border-zinc-800">
                    {benefit.reason && (
                      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{benefit.reason}</p>
                    )}
                    <Link
                      href={`/carriers?benefit=${benefit.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:underline dark:text-primary-400"
                    >
                      혜택 자세히 보기 →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        다시 진단하기
      </button>
    </div>
  );
}
