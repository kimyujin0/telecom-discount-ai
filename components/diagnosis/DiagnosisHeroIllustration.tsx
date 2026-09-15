import { Bot, Coins, FileSearch, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ANALYSIS_BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: Coins, label: "데이터 사용량 분석" },
  { icon: FileSearch, label: "이용 패턴 파악" },
  { icon: UserCheck, label: "맞춤 혜택 추천" },
];

/** 진단 인트로 히어로 우측 일러스트 — 로봇 안내 말풍선 + "AI 분석 중" 화면 + 분석 항목 배지 3개. */
export default function DiagnosisHeroIllustration() {
  return (
    <div className="relative mx-auto flex h-80 w-full max-w-md min-w-0 items-center justify-center sm:h-96">
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary-50 via-primary-100/60 to-primary-200/40 dark:from-primary-500/5 dark:via-primary-500/10 dark:to-primary-500/5" />

      <div className="flex items-center gap-3 px-4">
        {/* 스마트폰 프레임 */}
        <div className="relative flex w-44 shrink-0 -rotate-1 flex-col gap-2.5 rounded-[1.75rem] border border-primary-100 bg-white p-3.5 shadow-2xl shadow-primary-900/15 sm:w-52 dark:border-primary-500/20 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
              <Bot className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">AI 통신비 상담사</span>
          </div>

          <div className="max-w-[90%] self-start rounded-2xl rounded-tl-sm bg-primary-50 px-3.5 py-2.5 text-[12px] leading-relaxed font-medium text-primary-800 dark:bg-primary-500/10 dark:text-primary-300">
            안녕하세요! 저는 당신의 AI 통신비 상담사예요. 지금 어떤 혜택이 필요한지 자유롭게 말씀해주세요!
          </div>

          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-700 px-3 py-1.5 text-[11px] font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            AI 분석 중...
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2 w-4/5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2 w-3/5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>

        {/* 분석 항목 배지 3개 */}
        <div className="hidden shrink-0 flex-col gap-2.5 sm:flex">
          {ANALYSIS_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <badge.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-bold whitespace-nowrap text-zinc-700 dark:text-zinc-200">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
