"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const TOAST_VISIBLE_MS = 5000;

/**
 * 저장한 혜택 카드의 "썼어요" 버튼. 서버(SavedBenefitsSection)가 lib/benefitUsageQuota.ts로 이미
 * 계산해 둔 "이번 주기에 더 쓸 수 있는지"를 props로 받아 그대로 보여주고, 실제 기록은 이 컴포넌트가
 * 브라우저에서 benefit_usages에 직접 쓴다(saved_benefits와 같은 패턴 — RLS가 본인 행만 허용한다).
 *
 * 두 종류의 "취소"가 있다:
 *   - 방금 누른 직후: 5초간 "사용 기록을 남겼어요 · 취소" 토스트 (이 컴포넌트의 로컬 상태로만 보여준다
 *     — 서버 재조회 없이도 바로 되돌릴 수 있어야 해서다).
 *   - 이미 이번 주기를 다 써서 버튼이 막힌 상태: 옆에 작은 "취소" 글자를 항상 보여준다(실수로 한 번
 *     더 누른 경우를 되돌리기 위함). 이때는 서버가 계산해 전달한 initialLastUsageId를 지운다.
 */
export default function UseBenefitButton({
  userId,
  benefitId,
  amountDefault,
  upcomingLabel,
  usedUp,
  doneLabel,
  lastUsageId,
}: {
  userId: string;
  benefitId: string;
  /** "썼어요" 확인 폼에 기본으로 채워줄 금액(원) — benefits.estimated_monthly_saving. */
  amountDefault: number;
  /** 아직 이용 가능한 기간이 아닐 때(lib/dday.ts tone === "upcoming") 보여줄 안내 문구. 있으면 버튼 자체를 숨긴다. */
  upcomingLabel?: string | null;
  /** 이번 주기 한도를 이미 다 썼는지 (서버가 계산). */
  usedUp: boolean;
  /** usedUp일 때 보여줄 문구 (예: "이번 달 사용 완료"). */
  doneLabel?: string;
  /** usedUp일 때, 취소하면 지울 이번 주기 마지막 사용 기록의 id. */
  lastUsageId?: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(amountDefault);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [justUsedId, setJustUsedId] = useState<string | null>(null);

  useEffect(() => {
    if (!justUsedId) return;
    const timer = window.setTimeout(() => setJustUsedId(null), TOAST_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [justUsedId]);

  const handleUndo = async (usageId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("benefit_usages").delete().eq("id", usageId);
    if (deleteError) {
      console.error("[use-benefit] failed to undo usage", deleteError);
      return;
    }
    setJustUsedId(null);
    router.refresh();
  };

  const handleConfirm = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || pending) return;
    if (!Number.isFinite(amount) || amount < 0) {
      setError(true);
      return;
    }

    setPending(true);
    setError(false);
    const { data, error: insertError } = await supabase
      .from("benefit_usages")
      .insert({ user_id: userId, benefit_id: benefitId, saved_amount: Math.round(amount) })
      .select("id")
      .single();
    setPending(false);

    if (insertError || !data) {
      console.error("[use-benefit] failed to record usage", insertError);
      setError(true);
      return;
    }

    setEditing(false);
    setJustUsedId(data.id as string);
    router.refresh();
  };

  if (upcomingLabel) {
    return <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{upcomingLabel}</span>;
  }

  // 방금 "썼어요"를 누른 직후 — 서버 재조회(router.refresh) 결과가 반영되기 전에도 바로 취소할 수 있다.
  if (justUsedId) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">사용 기록을 남겼어요!</span>
        <button
          type="button"
          onClick={() => handleUndo(justUsedId)}
          className="text-xs font-medium text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          취소
        </button>
      </div>
    );
  }

  if (usedUp) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {doneLabel}
        </span>
        {lastUsageId && (
          <button
            type="button"
            onClick={() => handleUndo(lastUsageId)}
            className="text-xs font-medium text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            취소
          </button>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          autoFocus
          aria-label="이번에 아낀 금액(원)"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <span className="text-xs text-zinc-400 dark:text-zinc-500">원</span>
        <button
          type="button"
          disabled={pending}
          onClick={handleConfirm}
          className="rounded-full bg-primary-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          확인
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(false);
          }}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          닫기
        </button>
        {error && <span className="text-xs font-medium text-red-600 dark:text-red-400">기록하지 못했어요.</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setAmount(amountDefault);
        setEditing(true);
      }}
      className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 transition hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
    >
      썼어요
    </button>
  );
}
