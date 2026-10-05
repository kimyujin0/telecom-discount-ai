"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { updateAnnualGoalAction, type AnnualGoalFormState } from "@/app/actions/account";

const INITIAL_STATE: AnnualGoalFormState = {};

/**
 * 절감액 요약 카드의 "연간 목표" 인라인 편집 폼 (components/mypage/EditNicknameForm.tsx와 같은 패턴).
 * 비워두고 저장하면 목표를 지워서, 다음 렌더부터 다시 최근 진단 결과의 예상 연간 절감액을
 * 기본 목표로 보여준다(진행 막대는 goalIsDefault로 그 사실을 표시한다).
 */
export default function AnnualGoalForm({ goal }: { goal: number | null }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateAnnualGoalAction, INITIAL_STATE);
  const router = useRouter();

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setEditing(false);
  }

  useEffect(() => {
    if (!state.success) return;
    router.refresh();
    // 의존성은 state.success가 아니라 state(참조) 전체 — success는 리터럴 true/false라 "성공 → 성공"처럼
    // 같은 값이 두 번 연속 오면(저장 두 번 연속 성공 등) 바뀌지 않아 effect가 다시 실행되지 않는다.
    // state는 매 액션 호출마다 새 객체라 항상 바뀌므로, 두 번째 저장에서도 router.refresh()가 호출된다.
  }, [state, router]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-500 transition hover:text-primary-700 dark:text-zinc-400 dark:hover:text-primary-400"
      >
        <Pencil className="h-3 w-3" />
        목표 수정
      </button>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-1.5">
      <input
        name="annualGoal"
        type="number"
        min={0}
        defaultValue={goal ?? ""}
        placeholder="직접 입력"
        autoFocus
        aria-label="연간 절감 목표(원)"
        className="h-8 w-28 rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-bold text-zinc-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="목표 저장"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label="취소"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <X className="h-4 w-4" />
      </button>
      {(state.fieldError || state.formError) && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{state.fieldError ?? state.formError}</p>
      )}
    </form>
  );
}
