import { isCarrierKey, type CarrierKey } from "@/lib/carriers";

// 로그인 사용자 표현의 단일 소스(SSOT). 서버(lib/auth/session.ts)와 브라우저(lib/auth/useAuthUser.ts)
// 양쪽에서 같은 모양을 쓰도록 순수 함수/타입만 모아둔다 — next/headers 같은 서버 전용 API 금지.

export interface AppUser {
  id: string;
  email: string | null;
  /** 이메일 로컬파트에서 뽑은 호칭. "OO님은 SKT를 이용 중이시죠?" 같은 문구에 쓴다. */
  nickname: string;
  /** 회원가입 때 선택한 이용 중인 통신사. 미선택이면 null. */
  carrier: CarrierKey | null;
}

/**
 * 이메일에서 호칭을 만든다 (별도 이름 입력 필드가 없으므로 로컬파트를 사용).
 * 너무 길면 자르고, 로컬파트가 없으면 "고객"으로 떨어진다.
 */
export function nicknameFromEmail(email: string | null | undefined): string {
  const localPart = email?.split("@")[0]?.trim();
  if (!localPart) return "고객";
  return localPart.length > 12 ? `${localPart.slice(0, 12)}…` : localPart;
}

/**
 * auth.users.user_metadata에 담긴 carrier를 읽는다.
 * profiles 테이블이 정본이지만(0006_create_profiles.sql), 회원가입 시 넘긴 메타데이터에도 같은 값이
 * 남아 있어 profiles 조회가 실패했을 때의 대비책으로 쓴다.
 */
export function carrierFromUserMetadata(metadata: unknown): CarrierKey | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).carrier;
  return isCarrierKey(raw) ? raw : null;
}
