"use client";

import { Check, X } from "lucide-react";
import type { PasswordChecks } from "@/lib/auth/password";

/** 비밀번호 실시간 체크리스트 한 줄 — 조건 충족 여부에 따라 아이콘/색이 바뀐다. */
function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${met ? "text-primary-600 dark:text-primary-400" : "text-zinc-400 dark:text-zinc-500"}`}
    >
      {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {label}
    </li>
  );
}

/** 회원가입/비밀번호 변경 폼이 공유하는 비밀번호 규칙 체크리스트. */
export default function PasswordChecklist({ checks }: { checks: PasswordChecks }) {
  return (
    <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
      <PasswordRule met={checks.length} label="8자 이상" />
      <PasswordRule met={checks.specialChar} label="특수문자 1개 이상" />
    </ul>
  );
}
