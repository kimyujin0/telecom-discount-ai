"use client";

import { Bot, SendHorizontal } from "lucide-react";
import { useState } from "react";
import type { KeyboardEvent } from "react";

interface FollowUpQuestionProps {
  question: string;
  quickReplies: string[];
  onAnswer: (value: string) => void;
}

export default function FollowUpQuestion({ question, quickReplies, onAnswer }: FollowUpQuestionProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
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
          {question}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => onAnswer(reply)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10"
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        직접 입력할래요
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="자유롭게 답변을 입력해주세요..."
          className="h-11 flex-1 rounded-2xl border border-zinc-300 bg-zinc-50 px-4 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-primary-900/40"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value.trim().length === 0}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
          aria-label="답변 전송"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
