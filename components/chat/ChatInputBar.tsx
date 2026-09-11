"use client";

import { useEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInputBar({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "답변을 입력해주세요...",
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 입력값이 비워지면(전송 후) textarea 높이도 초기화
  useEffect(() => {
    if (value === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-zinc-200 bg-white/80 px-3 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-4 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="max-h-32 flex-1 resize-none rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-900/40"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || value.trim().length === 0}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        aria-label="전송"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 translate-x-[1px]" aria-hidden="true">
          <path d="M4 12L20 4L13 20L11 13L4 12Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
