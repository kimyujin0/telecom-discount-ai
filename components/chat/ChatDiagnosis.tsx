"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import ChatInputBar from "./ChatInputBar";
import DiagnosisResultTeaser from "./DiagnosisResultTeaser";
import TypingIndicator from "./TypingIndicator";
import type { ChatMessageItem } from "./types";
import {
  CLOSING_MESSAGE,
  FOLLOW_UP_QUESTIONS,
  INITIAL_GREETING,
  TOTAL_USER_TURNS,
} from "@/lib/chat/dummy-flow";

let messageIdCounter = 0;
const nextMessageId = () => `msg-${Date.now()}-${messageIdCounter++}`;

function createInitialMessages(): ChatMessageItem[] {
  return [{ id: nextMessageId(), role: "assistant", content: INITIAL_GREETING }];
}

export default function ChatDiagnosis() {
  const [messages, setMessages] = useState<ChatMessageItem[]>(createInitialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // TODO: Vercel AI SDK + Claude API 연동 시 이 함수를 app/api/diagnosis 호출로 교체
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || isComplete) return;

    const userMessage: ChatMessageItem = { id: nextMessageId(), role: "user", content: trimmed };
    const nextTurn = userTurns + 1;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUserTurns(nextTurn);
    setIsTyping(true);

    const replyDelay = 600 + Math.random() * 500;
    window.setTimeout(() => {
      const isLastTurn = nextTurn >= TOTAL_USER_TURNS;
      const replyContent = isLastTurn ? CLOSING_MESSAGE : FOLLOW_UP_QUESTIONS[nextTurn - 1];

      setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", content: replyContent }]);
      setIsTyping(false);
      if (isLastTurn) setIsComplete(true);
    }, replyDelay);
  };

  const handleRestart = () => {
    setMessages(createInitialMessages());
    setInput("");
    setIsTyping(false);
    setUserTurns(0);
    setIsComplete(false);
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-2 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">🤖</div>
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">AI 소비 성향 진단</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            몇 가지 질문으로 맞춤 통신 혜택을 찾아드려요
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={scrollAnchorRef} />
        </div>
      </div>

      {isComplete ? (
        <div className="mx-auto w-full max-w-2xl">
          <DiagnosisResultTeaser onRestart={handleRestart} />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl">
          <ChatInputBar value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} />
        </div>
      )}
    </div>
  );
}
