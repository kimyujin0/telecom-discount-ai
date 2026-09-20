"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { unsaveBenefit } from "@/lib/saved/savedBenefitsClient";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/** 저장함 카드의 채워진 별 — 누르면 저장을 취소하고 목록을 새로 그린다. */
export default function UnsaveButton({ userId, benefitId }: { userId: string; benefitId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || pending) return;

    setPending(true);
    setFailed(false);
    const ok = await unsaveBenefit(supabase, userId, benefitId);
    if (ok) {
      // 서버 컴포넌트인 마이페이지가 목록을 다시 읽어 이 카드가 사라진다.
      router.refresh();
    } else {
      setFailed(true);
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed
      aria-label="저장 취소"
      title={failed ? "저장 취소에 실패했어요. 다시 시도해주세요." : "저장 취소"}
      className={`rounded-full p-1.5 transition disabled:opacity-60 ${
        failed
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
      }`}
    >
      <Star className="h-5 w-5" fill="currentColor" />
    </button>
  );
}
