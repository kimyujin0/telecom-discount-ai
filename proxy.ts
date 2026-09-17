import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16부터 middleware.ts는 proxy.ts로 이름이 바뀌었다 (동작은 동일).
//
// 여기서 하는 일은 하나다: 매 요청마다 Supabase 세션 쿠키를 읽어 필요하면 액세스 토큰을 갱신하고
// 갱신된 쿠키를 응답에 실어 보낸다. 서버 컴포넌트는 렌더링 중 쿠키를 쓸 수 없어서 토큰 갱신을
// 직접 반영할 수 없기 때문에, @supabase/ssr은 이 갱신을 proxy(미들웨어)에서 하도록 요구한다.
// 이게 빠지면 세션이 만료 시점에 조용히 끊기고 임의 로그아웃처럼 보인다.
//
// 페이지 접근 권한 판정은 여기서 하지 않는다 — 인증 검사는 데이터 소스에 가까운 쪽
// (lib/auth/session.ts의 requireUser())에서 하는 것이 Next.js 권장 방식이다.

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  // 환경변수가 없으면 인증 기능이 없는 것과 같으므로 요청을 그대로 통과시킨다.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // 인증 쿠키를 실어 보내는 응답은 CDN/프록시에 캐시되면 안 된다 (다른 사용자에게 세션이 새어나간다).
        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue);
        }
      },
    },
  });

  // 이 호출이 만료된 액세스 토큰을 갱신하고, 그 결과가 위 setAll을 통해 응답 쿠키에 반영된다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 자산과 이미지 최적화 요청에는 세션 갱신이 필요 없다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
