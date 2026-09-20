// 로그인/회원가입 후 돌아갈 경로(`next`) 검증 — 순수 함수(서버 액션·서버 컴포넌트 공용).
// 예전에는 /login 페이지, /signup 페이지, app/actions/auth.ts에 같은 함수가 세 벌 있었다.
//
// `next`는 이제 `/diagnosis/chat?session=<uuid>`처럼 쿼리스트링까지 담고 오므로, "내부 절대경로만 허용"하는
// 규칙을 한 곳에서 엄격하게 관리한다(오픈 리다이렉트 방지).

export const DEFAULT_NEXT_PATH = "/mypage";

/**
 * /login, /signup 주소의 쿼리스트링(`?next=...&claim=...`). 둘 다 없으면 빈 문자열.
 *   - next  : 인증 후 돌아갈 내부 경로
 *   - claim : 인증에 성공하면 그 계정으로 연결(claim)할 비로그인 진단 세션 id
 * 로그인 <-> 회원가입 전환 링크가 이 둘을 계속 들고 다니게 하는 데 쓴다.
 */
export function buildAuthSearch(nextPath: string | null, claimSessionId: string | null): string {
  const params = new URLSearchParams();
  if (nextPath) params.set("next", nextPath);
  if (claimSessionId) params.set("claim", claimSessionId);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_NEXT_PATH;
  // "//evil.com"(프로토콜 상대 URL)과 "/\evil.com"(브라우저가 //로 해석) 모두 외부로 나가는 경로다.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_NEXT_PATH;
  // 개행 등 제어문자로 헤더/경로를 깨뜨리는 입력 차단.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return DEFAULT_NEXT_PATH;
  return raw;
}
