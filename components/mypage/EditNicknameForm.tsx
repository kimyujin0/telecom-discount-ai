"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { updateNicknameAction, type NicknameFormState } from "@/app/actions/account";
import { PROFILE_UPDATED_EVENT } from "@/lib/auth/useAuthUser";

const INITIAL_STATE: NicknameFormState = {};

/**
 * 마이페이지 "닉네임" 행을 대체하는 인라인 편집 폼. 평소에는 값 + "수정" 버튼만 보이다가,
 * 누르면 그 자리에서 입력칸으로 바뀐다.
 *
 * 저장에 성공하면 두 가지를 함께 한다:
 *   - PROFILE_UPDATED_EVENT 발행 → 헤더(useAuthUser)처럼 닉네임을 보여주는 클라이언트 컴포넌트가
 *     즉시 다시 읽어온다 (onAuthStateChange는 로그인/로그아웃에만 반응해서 이 이벤트가 따로 필요하다).
 *   - router.refresh() → 이 페이지 자체(서버 컴포넌트, "OO님 반가워요!")도 새 값으로 다시 렌더된다.
 */
export default function EditNicknameForm({ nickname }: { nickname: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateNicknameAction, INITIAL_STATE);
  const router = useRouter();

  // 렌더 중 상태 조정(React 공식 패턴) — action 결과(state)가 바뀐 첫 렌더에서 바로 편집 모드를 닫는다.
  // useEffect에 넣지 않는 이유: 이 rerender 이후 곧바로 반영돼야 화면 깜빡임(편집 폼이 한 프레임 더
  // 보이는 것)이 없다.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setEditing(false);
  }

  // dispatchEvent/router.refresh()는 "외부 시스템에 알리기"라 useEffect가 맞다 — setState는 위에서 이미 처리했다.
  useEffect(() => {
    if (!state.success) return;
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    router.refresh();
  }, [state.success, router]);

  if (!editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{nickname}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-500 transition hover:text-primary-700 dark:text-zinc-400 dark:hover:text-primary-400"
        >
          <Pencil className="h-3 w-3" />
          수정
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <input
          name="nickname"
          defaultValue={nickname}
          maxLength={20}
          required
          autoFocus
          aria-label="닉네임"
          className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-bold text-zinc-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="닉네임 저장"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="취소"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {(state.fieldError || state.formError) && (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          {state.fieldError ?? state.formError}
        </p>
      )}
    </form>
  );
}
