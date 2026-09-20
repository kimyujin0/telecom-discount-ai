"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SavedBenefitsApi } from "@/lib/saved/useSavedBenefits";

type Hint = "login" | "error" | null;

const HINT_VISIBLE_MS = 5000;

// 말풍선은 클릭 이후에만(=브라우저에서만) 그려지므로 window를 직접 읽어도 SSR과 어긋나지 않는다.
// usePathname/useSearchParams를 쓰지 않는 이유: 정적 페이지에서 Suspense 경계를 강제하기 때문.
function loginHrefForCurrentPage(): string {
  return `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

/**
 * "혜택 저장하기" 별 버튼. 저장돼 있으면 채워진 별로 바뀌어 저장 여부를 바로 알 수 있다.
 * 비로그인 상태로 누르면 페이지를 떠나지 않고(진단 결과를 잃지 않도록) 옆에 로그인 안내 말풍선만 잠깐 띄운다.
 */
export default function SaveBenefitButton({
  benefitId,
  saver,
  showLabel = false,
  className = "",
}: {
  benefitId: string;
  saver: SavedBenefitsApi;
  /** 별 옆에 "저장하기"/"저장됨" 글자도 보여줄지 (공간이 넉넉한 곳에서만). */
  showLabel?: boolean;
  className?: string;
}) {
  const [hint, setHint] = useState<Hint>(null);

  const saved = saver.isSaved(benefitId);
  const pending = saver.isPending(benefitId);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), HINT_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const handleClick = async () => {
    if (saver.loading || pending) return;
    if (!saver.loggedIn) {
      setHint("login");
      return;
    }
    const ok = await saver.setSaved(benefitId, !saved);
    setHint(ok ? null : "error");
  };

  const label = saved ? "저장 취소" : "혜택 저장하기";

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`inline-flex items-center gap-1 rounded-full p-1.5 text-xs font-semibold transition disabled:opacity-60 ${
          saved
            ? "text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-amber-500 dark:text-zinc-500 dark:hover:bg-zinc-800"
        }`}
      >
        <Star className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
        {showLabel && <span className="pr-1">{saved ? "저장됨" : "저장하기"}</span>}
      </button>

      {hint && (
        <span
          role="status"
          className="absolute top-1/2 right-full z-20 mr-2 -translate-y-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-xs leading-snug font-medium whitespace-nowrap text-white shadow-lg dark:bg-zinc-700"
        >
          {hint === "login" ? (
            <>
              로그인 후 저장할 수 있어요 ·{" "}
              <Link href={loginHrefForCurrentPage()} className="font-bold text-primary-300 underline">
                로그인
              </Link>
            </>
          ) : (
            "저장하지 못했어요. 잠시 후 다시 시도해주세요."
          )}
        </span>
      )}
    </div>
  );
}
