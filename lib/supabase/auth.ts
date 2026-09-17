import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 서버에서 "로그인한 사용자로서" 동작하는 Supabase 클라이언트 (anon 키 + 요청 쿠키).
 *
 * lib/supabase/server.ts의 service role 클라이언트와 역할이 다르다:
 *   - server.ts   : RLS 우회, 사용자 구분 없음 — 진단 데이터 읽기/쓰기 등 백엔드 작업용
 *   - auth.ts(이것): RLS 적용, 요청 쿠키의 세션 = 현재 로그인 사용자 — 인증/본인 데이터 조회용
 *
 * 요청마다 새로 만들어야 한다(쿠키 스냅샷을 물고 있으므로 캐싱 금지).
 * 서버 컴포넌트에서는 쿠키 쓰기가 불가능해 setAll이 조용히 실패하는데, 토큰 갱신은 proxy.ts가
 * 담당하므로 문제되지 않는다 (@supabase/ssr 권장 구성).
 */
export async function createSupabaseAuthClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY 환경변수가 설정되어 있지 않습니다. .env.local을 확인해주세요.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트 렌더링 중에는 쿠키를 쓸 수 없다. proxy.ts가 세션을 갱신하므로 무시해도 안전하다.
        }
      },
    },
  });
}
