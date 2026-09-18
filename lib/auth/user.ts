import { isCarrierKey, type CarrierKey } from "@/lib/carriers";

// 로그인 사용자 표현의 단일 소스(SSOT). 서버(lib/auth/session.ts)와 브라우저(lib/auth/useAuthUser.ts)
// 양쪽에서 같은 모양을 쓰도록 순수 함수/타입만 모아둔다 — next/headers 같은 서버 전용 API 금지.

export interface AppUser {
  id: string;
  email: string | null;
  /** 헤더/마이페이지/진단 대화 호칭에 쓰는 표시용 이름. resolveNickname()으로 계산한다. */
  nickname: string;
  /** 회원가입 시 입력한 실명. 화면에는 노출하지 않는다. 0008 이전 가입자는 null. */
  name: string | null;
  /** 회원가입 때 선택한 이용 중인 통신사. 미선택이면 null. */
  carrier: CarrierKey | null;
}

/**
 * 이메일 로컬파트로 임시 호칭을 만든다. profiles.nickname이 없을 때(0008 마이그레이션 이전 가입자 등)의
 * 대체값으로만 쓴다 — resolveNickname()을 거쳐서 사용할 것.
 * 너무 길면 자르고, 로컬파트가 없으면 "고객"으로 떨어진다.
 */
export function nicknameFromEmail(email: string | null | undefined): string {
  const localPart = email?.split("@")[0]?.trim();
  if (!localPart) return "고객";
  return localPart.length > 12 ? `${localPart.slice(0, 12)}…` : localPart;
}

/**
 * profiles.nickname을 우선 쓰고, 비어 있으면 이메일 로컬파트로 대체한다.
 * 서버(lib/auth/session.ts)와 브라우저(lib/auth/useAuthUser.ts) 양쪽에서 같은 규칙을 쓰기 위한 SSOT.
 */
export function resolveNickname(profileNickname: string | null | undefined, email: string | null | undefined): string {
  const trimmed = profileNickname?.trim();
  return trimmed ? trimmed : nicknameFromEmail(email);
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
