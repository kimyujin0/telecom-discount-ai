import { cookies } from "next/headers";
import { isUuid } from "./resume";

// 비로그인 진단의 "이 브라우저가 만든 세션이다"를 증명하는 키 — httpOnly 쿠키에 담는다.
//
// diagnosis_sessions.anonymous_key는 원래 "비로그인 사용자 식별(쿠키/localStorage 발급 UUID)"용으로 설계됐는데
// (docs/database-schema.md), 이전 구현은 세션마다 랜덤 UUID를 만들어 버려서 아무도 그 값을 다시 제시할 수
// 없었다. 그래서 비로그인 진단은 만든 사람조차 나중에 다시 찾을 수 없었다.
//
// 이제 브라우저당 하나의 키를 쿠키로 발급하고 그 브라우저의 모든 비로그인 세션에 같은 키를 기록한다.
// 결과 복원과 로그인 후 계정 연결(claim)은 "쿠키의 키 == 세션의 anonymous_key"일 때만 허용한다 — 그래서
// 결과 URL(?session=...)이 공유되거나 브라우저 기록에 남아도, sessionId만 아는 다른 사람은 그 진단을 볼 수도
// 가져갈 수도 없다. httpOnly라 페이지의 스크립트가 값을 읽을 수 없다.

export const ANONYMOUS_KEY_COOKIE = "tms_anon_key";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

/** 요청에 실린 키. 없거나 형식이 다르면 null. (서버 컴포넌트/액션/라우트 핸들러 어디서든 읽기 가능) */
export async function readAnonymousKey(): Promise<string | null> {
  const value = (await cookies()).get(ANONYMOUS_KEY_COOKIE)?.value;
  return isUuid(value) ? value : null;
}

/**
 * 키를 읽고, 없으면 새로 발급해 쿠키에 심는다.
 * 쿠키를 쓸 수 있는 곳(라우트 핸들러/서버 액션)에서만 호출할 것 — 서버 컴포넌트 렌더링 중에는 쓰기가 불가능하다.
 */
export async function getOrCreateAnonymousKey(): Promise<string> {
  const existing = await readAnonymousKey();
  if (existing) return existing;

  const key = crypto.randomUUID();
  (await cookies()).set(ANONYMOUS_KEY_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
  return key;
}
