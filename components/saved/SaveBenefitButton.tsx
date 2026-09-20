"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
 * 비로그인 상태로 누르면 loginHref가 있을 때는 로그인 페이지로 이동하고(돌아올 곳이 실려 있다), 없을 때는
 * 페이지를 떠나지 않고 옆에 로그인 안내 말풍선만 잠깐 띄운다.
 */
export default function SaveBenefitButton({
  benefitId,
  saver,
  showLabel = false,
  className = "",
  loginHref,
}: {
  benefitId: string;
  saver: SavedBenefitsApi;
  /**
   * 비로그인 상태에서 눌렀을 때 바로 이동할 로그인 경로. 주면 안내 말풍선 대신 곧장 이동한다 — 이 화면의
   * 상태를 로그인 후에 되살릴 수 있을 때(진단 결과의 ?session=)만 넘긴다. 없으면 말풍선으로 안내만 한다.
   */
  loginHref?: string;
  /** 별 옆에 "저장하기"/"저장됨" 글자도 보여줄지 (공간이 넉넉한 곳에서만). */
  showLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [hint, setHint] = useState<Hint>(null);

  const saved = saver.isSaved(benefitId);
  const pending = saver.isPending(benefitId);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), HINT_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const handleSave = useCallback(async () => {
    if (pending) return;
    if (!saver.loggedIn) {
      if (loginHref) {
        router.push(loginHref);
        return;
      }
      setHint("login");
      return;
    }
    const ok = await saver.setSaved(benefitId, !saved);
    setHint(ok ? null : "error");
  }, [pending, saver, loginHref, router, benefitId, saved]);

  // 로그인 상태/저장 목록을 아직 확인하는 중에 누른 클릭은 버리지 않고, 확인이 끝나는 순간 이어서 처리한다.
  // (로그인 후 결과 화면으로 돌아오자마자 별을 누르는 경우가 특히 그렇다 — 조용히 무시되면 "안 눌렸나?" 싶어진다.)
  const queuedClickRef = useRef(false);
  useEffect(() => {
    if (saver.loading || !queuedClickRef.current) return;
    queuedClickRef.current = false;
    void handleSave();
  }, [saver.loading, handleSave]);

  const handleClick = () => {
    if (saver.loading) {
      queuedClickRef.current = true;
      return;
    }
    void handleSave();
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
