"use client";

import { MailCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";
import { CARRIER_LABELS, CARRIER_OPTIONS } from "@/lib/carriers";
import TextField from "./TextField";

const INITIAL_STATE: AuthFormState = {};

export default function SignupForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(signUpAction, INITIAL_STATE);

  // 이메일 인증이 켜진 프로젝트에서는 가입 직후 세션이 없다 — 폼 대신 안내 화면을 보여준다.
  if (state.emailConfirmationRequired) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="mt-4 text-base font-extrabold text-zinc-900 dark:text-zinc-50">인증 메일을 보냈어요</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{state.values?.email}</span> 으로 보낸
          메일의 인증 링크를 눌러 가입을 완료해주세요.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white transition-colors hover:bg-primary-800"
        >
          로그인 화면으로
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      <TextField
        id="signup-email"
        name="email"
        type="email"
        label="이메일"
        placeholder="you@example.com"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />

      <TextField
        id="signup-password"
        name="password"
        type="password"
        label="비밀번호"
        placeholder="8자 이상 입력해주세요"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint="8자 이상으로 설정해주세요."
      />

      <fieldset>
        <legend className="text-sm font-bold text-zinc-700 dark:text-zinc-200">이용 중인 통신사</legend>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          진단할 때 이 통신사의 혜택을 먼저 찾아드려요.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CARRIER_OPTIONS.map((carrier) => (
            <label
              key={carrier}
              className="group relative flex cursor-pointer items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-50 py-3 text-sm font-semibold text-zinc-600 transition hover:border-primary-300 hover:bg-primary-50 has-checked:border-primary-600 has-checked:bg-primary-50 has-checked:text-primary-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-primary-500/50 dark:has-checked:border-primary-500 dark:has-checked:bg-primary-500/10 dark:has-checked:text-primary-300"
            >
              <input
                type="radio"
                name="carrier"
                value={carrier}
                defaultChecked={state.values?.carrier === carrier}
                className="sr-only"
              />
              {CARRIER_LABELS[carrier]}
            </label>
          ))}
        </div>
        {state.fieldErrors?.carrier && (
          <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{state.fieldErrors.carrier}</p>
        )}
      </fieldset>

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
          "가입 중..."
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            회원가입
          </>
        )}
      </button>
    </form>
  );
}
