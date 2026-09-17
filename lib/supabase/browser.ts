"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 브라우저(클라이언트 컴포넌트) 전용 Supabase 클라이언트.
 *
 * 세션을 localStorage가 아니라 쿠키에 저장하는 @supabase/ssr 버전을 쓴다 — 그래야 같은 세션을
 * 서버 컴포넌트/서버 액션/라우트 핸들러(lib/supabase/auth.ts)에서도 읽을 수 있다.
 * anon 키는 RLS로 보호되는 공개 키라 브라우저 번들에 포함되어도 안전하다
 * (service role 키는 절대 금지 — lib/supabase/server.ts 주석 참고).
 *
 * 환경변수가 없으면 null을 반환한다(예외를 던지지 않는다) — 이 클라이언트는 SiteHeader처럼
 * 모든 페이지에 깔리는 컴포넌트에서 쓰이므로, 여기서 예외를 던지면 에러 경계 없이 페이지 전체
 * 렌더링이 무너진다. 호출부(lib/auth/useAuthUser.ts)가 null을 "로그인 기능 사용 불가"로 처리한다.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되어 있지 않습니다. 배포 환경(Vercel 등)의 환경변수 설정을 확인해주세요.",
    );
    return null;
  }

  // createBrowserClient는 기본적으로 싱글턴이라 호출마다 새 클라이언트가 생기지 않는다.
  return createBrowserClient(url, anonKey);
}
