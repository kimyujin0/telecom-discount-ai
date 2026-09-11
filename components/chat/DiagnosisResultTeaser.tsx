"use client";

import { useState } from "react";

// TODO: diagnosis_results / diagnosis_result_benefits 실제 데이터로 교체 (docs/database-schema.md 참고)
const DUMMY_PERSONA = {
  emoji: "⚖️",
  name: "밸런스형",
  tagline: "특정 카테고리에 치우치지 않고 고르게 소비하는 균형 잡힌 타입이에요.",
};

const DUMMY_BENEFITS = [
  { title: "OTT 결합 할인", provider: "SKT", monthly: 5000 },
  { title: "편의점 정기 할인 쿠폰", provider: "KT", monthly: 3000 },
  { title: "모바일 데이터 추가 제공", provider: "LG U+", monthly: 4000 },
];

const TOTAL_MONTHLY = DUMMY_BENEFITS.reduce((sum, benefit) => sum + benefit.monthly, 0);

interface DiagnosisResultTeaserProps {
  onRestart: () => void;
}

export default function DiagnosisResultTeaser({ onRestart }: DiagnosisResultTeaserProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="result-card-enter mx-3 mb-3 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 shadow-lg dark:border-indigo-900/40 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-purple-950/30 sm:mx-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          진단 완료
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">AI 소비 성향 진단 결과</span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-zinc-800">
          {DUMMY_PERSONA.emoji}
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{DUMMY_PERSONA.name}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{DUMMY_PERSONA.tagline}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/70 p-3 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">예상 월 절감액</p>
        <p className="mt-0.5 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
          {TOTAL_MONTHLY.toLocaleString()}원
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          티끌 모아 태산! 1년이면 {(TOTAL_MONTHLY * 12).toLocaleString()}원을 아낄 수 있어요.
        </p>
      </div>

      {expanded && (
        <ul className="mt-3 space-y-2">
          {DUMMY_BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-zinc-700 dark:text-zinc-200">
                <span className="mr-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {benefit.provider}
                </span>
                {benefit.title}
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                -{benefit.monthly.toLocaleString()}원/월
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          {expanded ? "간략히 보기" : "진단 결과 보기"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          다시 진단
        </button>
      </div>
    </div>
  );
}
