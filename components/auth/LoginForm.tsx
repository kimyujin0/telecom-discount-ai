"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { signInAction, type AuthFormState } from "@/app/actions/auth";
import TextField from "./TextField";

const INITIAL_STATE: AuthFormState = {};

export default function LoginForm({ nextPath, claimSessionId = null }: { nextPath: string; claimSessionId?: string | null }) {
  const [state, action, pending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      {claimSessionId && <input type="hidden" name="claim" value={claimSessionId} />}

      <TextField
        id="login-email"
        name="email"
        type="email"
        label="이메일"
        placeholder="you@example.com"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />

      <TextField
        id="login-password"
        name="password"
        type="password"
        label="비밀번호"
        placeholder="비밀번호를 입력해주세요"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />

      {state.formError && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
        >
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary-700 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        {pending ? (
          "로그인 중..."
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            로그인
          </>
        )}
      </button>
    </form>
  );
}
