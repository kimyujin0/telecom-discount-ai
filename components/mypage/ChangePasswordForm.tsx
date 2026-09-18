"use client";

import { KeyRound } from "lucide-react";
import { useActionState, useState } from "react";
import { updatePasswordAction, type PasswordFormState } from "@/app/actions/account";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import TextField from "@/components/auth/TextField";
import { checkPassword, isPasswordValid } from "@/lib/auth/password";

const INITIAL_STATE: PasswordFormState = {};

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, INITIAL_STATE);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordChecks = checkPassword(password);
  const passwordValid = isPasswordValid(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // 렌더 중 상태 조정(React 공식 패턴) — action 결과(state)가 바뀐 첫 렌더에서 바로 입력값을 비운다.
  // 성공하면 다음 변경을 위한 빈 폼으로 되돌린다 (서버는 비밀번호를 값으로 되돌려주지 않으니 직접 초기화).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <form action={action} className="space-y-4">
      <TextField
        id="account-password"
        name="password"
        type="password"
        label="새 비밀번호"
        placeholder="8자 이상 + 특수문자 포함"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      >
        <PasswordChecklist checks={passwordChecks} />
      </TextField>

      <TextField
        id="account-confirm-password"
        name="confirmPassword"
        type="password"
        label="새 비밀번호 확인"
        placeholder="한 번 더 입력해주세요"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={confirmPassword.length > 0 && !passwordsMatch ? "비밀번호가 일치하지 않아요." : undefined}
      />

      {state.fieldError && (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {state.fieldError}
        </p>
      )}
      {state.formError && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
        >
          {state.formError}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 dark:border-primary-900/40 dark:bg-primary-500/10 dark:text-primary-300"
        >
          비밀번호가 변경됐어요.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !passwordValid || !passwordsMatch}
        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary-700 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        <KeyRound className="h-4 w-4" />
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
