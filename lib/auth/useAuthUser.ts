"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { resolveNickname } from "./user";

// 헤더처럼 모든 페이지에 깔리는 클라이언트 컴포넌트에서 로그인 상태를 읽기 위한 훅.
//
// 서버에서 내려주는 방식(getCurrentUser() -> props)을 쓰지 않는 이유: SiteHeader는 클라이언트
// 컴포넌트인 DiagnosisExperience 안에서도 렌더되어 서버 props를 받을 경로가 없다. 대신 브라우저
// 클라이언트가 쿠키의 세션을 그대로 읽고 onAuthStateChange로 로그인/로그아웃을 즉시 반영한다.
//
// 표시 전용이다 — 여기서 나온 값으로 권한 판단을 하면 안 된다(권한 검사는 서버의
// lib/auth/session.ts에서 getUser()로 토큰을 검증해 수행한다).

export interface ClientAuthUser {
  id: string;
  email: string | null;
  nickname: string;
}

/**
 * 마이페이지에서 닉네임을 바꾼 뒤 헤더 등 이 훅을 쓰는 다른 컴포넌트에 즉시 반영하기 위한 이벤트.
 * onAuthStateChange는 로그인/로그아웃에만 반응하고 프로필 행 변경은 감지하지 못해서 따로 둔다.
 * 디스패치 쪽은 components/mypage/EditNicknameForm.tsx 참고.
 */
export const PROFILE_UPDATED_EVENT = "tmsan:profile-updated";

/** profiles.nickname을 조회해 붙인다. 실패해도 로그인 자체는 막지 않고 이메일 기반 호칭으로 대체한다. */
async function loadClientUser(supabase: SupabaseClient, user: User | null | undefined): Promise<ClientAuthUser | null> {
  if (!user) return null;

  const { data: profile, error } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
  if (error) console.error("[auth] failed to load profile nickname", error);

  return { id: user.id, email: user.email ?? null, nickname: resolveNickname(profile?.nickname, user.email) };
}

export function useAuthUser(): { user: ClientAuthUser | null; loading: boolean } {
  const [user, setUser] = useState<ClientAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    if (!supabase) {
      // 환경변수 누락 등으로 클라이언트를 만들 수 없으면 "비로그인"으로 취급하고 조용히 넘어간다
      // (원인은 getSupabaseBrowserClient가 이미 console.error로 남긴다). effect 몸체에서 setState를
      // 동기 호출하지 않도록 Promise.resolve()로 한 틱 미룬다.
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const refresh = () => {
      supabase.auth.getUser().then(async ({ data }) => {
        const clientUser = await loadClientUser(supabase, data.user);
        if (!active) return;
        setUser(clientUser);
        setLoading(false);
      });
    };

    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadClientUser(supabase, session?.user).then((clientUser) => {
        if (!active) return;
        setUser(clientUser);
        setLoading(false);
      });
    });

    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
    };
  }, []);

  return { user, loading };
}
