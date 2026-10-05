import { PiggyBank } from "lucide-react";
import AnnualGoalForm from "./AnnualGoalForm";

/** 달성률 구간별 응원 문구 — "티끌모아 태산"을 숫자로 체감하게 하려는 목적이라, 낮은 구간도 긍정적으로 쓴다. */
function encouragement(progress: number, hasAnyUsage: boolean): string {
  if (!hasAnyUsage) return "혜택을 쓰고 '썼어요'를 눌러 티끌을 모아보세요!";
  if (progress >= 100) return "목표를 이미 넘었어요! 대단해요 🎉";
  if (progress >= 75) return "목표에 거의 다 왔어요, 조금만 더!";
  if (progress >= 50) return "절반 넘게 모았어요 — 이대로 쭉!";
  if (progress >= 25) return "티끌이 꽤 쌓이고 있어요 👍";
  return "좋은 시작이에요, 계속 아껴봐요!";
}

export default function SavingsSummaryCard({
  monthlyTotal,
  yearlyTotal,
  goal,
  goalDefault,
}: {
  monthlyTotal: number;
  yearlyTotal: number;
  /** 사용자가 직접 입력한 연간 목표(profiles.annual_saving_goal). 없으면 null. */
  goal: number | null;
  /** 목표를 직접 입력하지 않았을 때 대신 쓸 기본값 — 최근 진단 결과의 예상 연간 절감액. 진단 이력이 없으면 null. */
  goalDefault: number | null;
}) {
  const goalIsDefault = goal === null;
  const effectiveGoal = goal ?? goalDefault;
  const hasGoal = effectiveGoal !== null && effectiveGoal > 0;
  const progress = hasGoal ? Math.min(100, Math.round((yearlyTotal / effectiveGoal) * 100)) : 0;

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-zinc-700 dark:text-zinc-200">
        <PiggyBank className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        티끌모아 태산 — 절감액 요약
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary-50 px-4 py-3.5 dark:bg-primary-500/10">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">이번 달 아낌</p>
          <p className="mt-1 text-xl font-extrabold text-primary-700 sm:text-2xl dark:text-primary-300">
            {monthlyTotal.toLocaleString()}원
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 px-4 py-3.5 dark:bg-zinc-800/50">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">올해 누적</p>
          <p className="mt-1 text-xl font-extrabold text-zinc-800 sm:text-2xl dark:text-zinc-100">
            {yearlyTotal.toLocaleString()}원
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            연간 목표{" "}
            {hasGoal && (
              <span className="font-bold text-zinc-800 dark:text-zinc-100">{effectiveGoal.toLocaleString()}원</span>
            )}
            {hasGoal && goalIsDefault && (
              <span className="ml-1 text-zinc-400 dark:text-zinc-500">(최근 진단 결과 기준)</span>
            )}
          </p>
          <AnnualGoalForm goal={goal} />
        </div>

        {hasGoal ? (
          <>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-primary-600 transition-all dark:bg-primary-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{progress}% 달성</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            진단을 받거나 목표를 직접 입력하면 진행 막대가 나타나요.
          </p>
        )}

        <p className="mt-3 text-sm font-semibold text-primary-700 dark:text-primary-300">
          {encouragement(progress, yearlyTotal > 0)}
        </p>
      </div>
    </section>
  );
}
