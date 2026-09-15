"use client";

import { Bot, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ANALYZING_STEPS } from "@/lib/chat/constants";

// 각 체크리스트 항목이 순차적으로 나타나는 간격(ms).
const STEP_INTERVAL_MS = 650;

/** 제출 직후 "AI 분석 중" 연출 — 실제 응답 도착 여부와 무관하게 체크리스트가 순차적으로 표시된다. */
export default function AnalyzingChecklist() {
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    if (checkedCount >= ANALYZING_STEPS.length) return;
    const timer = window.setTimeout(() => setCheckedCount((n) => n + 1), STEP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [checkedCount]);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-primary-700 text-white">
          <Bot className="h-7 w-7" />
        </span>
        <p className="mt-5 text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-50">
          AI가 당신의 사용 패턴을
          <br />
          분석하고 있어요...
        </p>

        <ul className="mt-7 w-full max-w-xs space-y-3 text-left">
          {ANALYZING_STEPS.map((step, index) => {
            const isChecked = index < checkedCount;
            const isCurrent = index === checkedCount;
            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isChecked
                    ? "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
                    : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isChecked
                      ? "bg-primary-600 text-white"
                      : isCurrent
                        ? "animate-pulse bg-zinc-300 dark:bg-zinc-600"
                        : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                >
                  {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {step}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
