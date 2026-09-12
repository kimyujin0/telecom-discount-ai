"use client";

import { useState } from "react";

export interface DiagnosisResultBenefit {
  provider: string;
  title: string;
  monthlySaving: number;
}

export interface DiagnosisResultData {
  personaEmoji: string;
  personaName: string;
  description: string;
  benefits: DiagnosisResultBenefit[];
  totalMonthlySaving: number;
  totalYearlySaving: number;
}

interface DiagnosisResultTeaserProps {
  result: DiagnosisResultData;
  onRestart: () => void;
}

export default function DiagnosisResultTeaser({ result, onRestart }: DiagnosisResultTeaserProps) {
  const [expanded, setExpanded] = useState(false);

  const handleKakaoNotify = () => {
    // TODO: 카카오 "나에게 보내기"/알림톡 연동 (다음 프롬프트에서 별도 구현 예정)
    // - 카카오 로그인 및 알림 수신 동의 처리
    // - 사용자 식별자 + 이번 진단 결과(result)를 서버로 전달해 맞춤 혜택 알림톡 발송 요청
  };

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
          {result.personaEmoji}
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{result.personaName}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{result.description}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/70 p-3 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">예상 월 절감액</p>
        <p className="mt-0.5 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
          {result.totalMonthlySaving.toLocaleString()}원
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          티끌 모아 태산! 1년이면 {result.totalYearlySaving.toLocaleString()}원을 아낄 수 있어요.
        </p>
      </div>

      {expanded && (
        <ul className="mt-3 space-y-2">
          {result.benefits.map((benefit) => (
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
                -{benefit.monthlySaving.toLocaleString()}원/월
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

      <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          진단 내용을 바탕으로 알림을 받으시겠어요?
          <br />
          *알림은 맞춤형 할인혜택이 카카오톡 알림톡으로 발송됩니다.
        </p>
        <button
          type="button"
          onClick={handleKakaoNotify}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#FDD800]"
        >
          <span aria-hidden>💬</span>
          카카오로 받아보기
        </button>
      </div>
    </div>
  );
}
