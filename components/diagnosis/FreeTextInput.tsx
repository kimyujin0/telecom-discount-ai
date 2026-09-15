"use client";

import { Bot, SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { FREE_TEXT_PLACEHOLDER } from "@/lib/chat/constants";

export default function FreeTextInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
          <Bot className="h-4.5 w-4.5" />
        </span>
        <p className="flex-1 pt-1 text-lg leading-relaxed font-semibold text-zinc-900 sm:text-xl dark:text-zinc-50">
          지금 상황을 편하게 이야기해주세요. 데이터, OTT, 해외 이용 같은 이야기면 무엇이든 좋아요.
        </p>
      </div>

      <textarea
        ref={textareaRef}
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={FREE_TEXT_PLACEHOLDER}
        className="mt-6 w-full resize-none rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-[15px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-primary-900/40"
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Shift+Enter로 줄바꿈할 수 있어요.</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value.trim().length === 0}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary-700 px-6 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          분석 시작하기
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
