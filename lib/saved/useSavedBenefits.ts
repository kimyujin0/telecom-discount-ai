"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { saveBenefit, unsaveBenefit } from "./savedBenefitsClient";

// 혜택 카드들이 "이 혜택을 저장했는지"를 함께 보여주기 위한 훅. 카드마다 따로 조회하지 않도록
// 목록을 그리는 부모(CarrierBenefitsBoard, DiagnosisResult)에서 한 번만 호출해 아래로 내려준다.
//
// 표시 전용 상태다 — 실제 접근 제어는 saved_benefits의 RLS가 한다(다른 사람 행은 읽기/쓰기 모두 불가).

export interface SavedBenefitsApi {
  /** 로그인 여부/저장 목록 확인이 끝나기 전. */
  loading: boolean;
  loggedIn: boolean;
  isSaved: (benefitId: string) => boolean;
  isPending: (benefitId: string) => boolean;
  /** save=true면 저장, false면 저장 취소. 성공하면 true. 화면은 낙관적으로 먼저 바꾸고 실패하면 되돌린다. */
  setSaved: (benefitId: string, save: boolean) => Promise<boolean>;
}

export function useSavedBenefits(): SavedBenefitsApi {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    if (!supabase) {
      // 환경변수 누락 등 — 비로그인처럼 취급한다(원인은 getSupabaseBrowserClient가 이미 로그로 남긴다).
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("saved_benefits").select("benefit_id");
      if (!active) return;
      // 0010 마이그레이션 미적용 등으로 못 읽어도 화면은 "아무것도 저장 안 됨"으로 계속 동작한다.
      if (error) console.error("[saved] failed to load saved benefits", error);

      setUserId(user.id);
      setSavedIds(new Set((data ?? []).map((row) => row.benefit_id as string)));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const setSaved = useCallback(
    async (benefitId: string, save: boolean): Promise<boolean> => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) return false;

      const applySaved = (value: boolean) =>
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (value) next.add(benefitId);
          else next.delete(benefitId);
          return next;
        });

      setPendingIds((prev) => new Set(prev).add(benefitId));
      applySaved(save);

      const ok = save
        ? await saveBenefit(supabase, userId, benefitId)
        : await unsaveBenefit(supabase, userId, benefitId);
      if (!ok) applySaved(!save);

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(benefitId);
        return next;
      });
      return ok;
    },
    [userId],
  );

  return {
    loading,
    loggedIn: userId !== null,
    isSaved: (benefitId) => savedIds.has(benefitId),
    isPending: (benefitId) => pendingIds.has(benefitId),
    setSaved,
  };
}
