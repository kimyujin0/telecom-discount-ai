// 회원가입 비밀번호 규칙의 단일 소스(SSOT).
// 서버 액션(app/actions/auth.ts)의 zod 검증과 클라이언트 실시간 체크리스트(components/auth/SignupForm.tsx)가
// 이 파일을 함께 참조해 규칙이 어긋나지 않게 한다. "use client"/"use server" 지시어가 없는 순수 함수라
// 양쪽 번들에서 그대로 import할 수 있다.

export const PASSWORD_MIN_LENGTH = 8;

/** 영문자·숫자가 아닌 문자는 모두 "특수문자"로 취급한다(공백 포함). */
export const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export interface PasswordChecks {
  length: boolean;
  specialChar: boolean;
}

export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    specialChar: PASSWORD_SPECIAL_CHAR_REGEX.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const checks = checkPassword(password);
  return checks.length && checks.specialChar;
}
