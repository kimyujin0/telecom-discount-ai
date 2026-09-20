// "진단 결과 화면으로 돌아오기" 링크 규칙 — 순수 함수(브라우저의 결과 화면과 서버 액션이 함께 쓴다).
//
// 비로그인으로 진단을 마친 사용자가 "혜택 저장하기"를 눌러 로그인하러 갔다가 원래 결과 화면으로 돌아오려면,
// 로그인 페이지의 `next` 파라미터에 이 결과의 sessionId를 담아 보내야 한다:
//   /login?next=%2Fdiagnosis%2Fchat%3Fsession%3D<uuid>
// 로그인이 끝나면 `next`(= /diagnosis/chat?session=<uuid>)로 돌아오고, 그 페이지가 sessionId로 결과를 복원한다.

import type { DiagnosisResultData } from "@/components/diagnosis/DiagnosisResult";

export const DIAGNOSIS_CHAT_PATH = "/diagnosis/chat";

/** 저장돼 있던 진단 결과를 그대로 다시 보여주기 위해 서버가 화면에 넘기는 값. */
export interface ResumableDiagnosis {
  sessionId: string;
  result: DiagnosisResultData;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** 결과 화면으로 돌아오는 내부 경로. */
export function buildDiagnosisResumePath(sessionId: string): string {
  return `${DIAGNOSIS_CHAT_PATH}?session=${encodeURIComponent(sessionId)}`;
}

/** 이 결과 화면으로 돌아오도록 `next`를 실어 보내는 로그인 경로. */
export function buildLoginPathForDiagnosis(sessionId: string): string {
  return `/login?next=${encodeURIComponent(buildDiagnosisResumePath(sessionId))}`;
}

/**
 * `next` 경로가 "진단 결과 복귀" 경로면 그 sessionId를, 아니면 null.
 * 로그인/회원가입 액션이 이걸로 "이번 로그인으로 가져와야 할 비로그인 진단"을 알아낸다.
 */
export function parseResumeSessionId(nextPath: string): string | null {
  try {
    const url = new URL(nextPath, "http://internal.invalid");
    if (url.pathname !== DIAGNOSIS_CHAT_PATH) return null;
    const session = url.searchParams.get("session");
    return isUuid(session) ? session : null;
  } catch {
    return null;
  }
}
