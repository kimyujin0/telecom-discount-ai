"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import ChatInputBar from "./ChatInputBar";
import DiagnosisResultTeaser, { type DiagnosisResultData } from "./DiagnosisResultTeaser";
import TypingIndicator from "./TypingIndicator";
import type { ChatMessageItem } from "./types";
import { INITIAL_GREETING } from "@/lib/chat/constants";
import { getPersonaByKey } from "@/lib/chat/personas";

const DIAGNOSIS_MARKER = "<<<DIAGNOSIS_RESULT_JSON>>>";

interface DiagnosisMarkerPayload {
  done: true;
  personaKey: string;
  personaName: string;
  description: string;
  benefits: { provider: string; title: string; monthlySaving: number }[];
  totalMonthlySaving: number;
  totalYearlySaving: number;
}

let messageIdCounter = 0;
const nextMessageId = () => `msg-${Date.now()}-${messageIdCounter++}`;

function createInitialMessages(): ChatMessageItem[] {
  return [{ id: nextMessageId(), role: "assistant", content: INITIAL_GREETING }];
}

export default function ChatDiagnosis() {
  const [messages, setMessages] = useState<ChatMessageItem[]>(createInitialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResultData | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const updateAssistantMessage = (id: string, content: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || diagnosisResult) return;

    setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", content: trimmed }]);
    setInput("");
    setIsTyping(true);

    const assistantId = nextMessageId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: trimmed }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.json().catch(() => null);
        updateAssistantMessage(
          assistantId,
          errorBody?.error ?? "진단 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
        );
        setIsTyping(false);
        return;
      }

      const headerSessionId = response.headers.get("X-Session-Id");
      if (headerSessionId) sessionIdRef.current = headerSessionId;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rendered = 0;
      let markerIndex = -1;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (markerIndex === -1) {
          const idx = buffer.indexOf(DIAGNOSIS_MARKER);
          if (idx === -1) {
            const toRender = buffer.slice(rendered);
            if (toRender) {
              rendered = buffer.length;
              updateAssistantMessage(assistantId, buffer.slice(0, rendered));
            }
          } else {
            markerIndex = idx;
            rendered = buffer.length;
            updateAssistantMessage(assistantId, buffer.slice(0, markerIndex).trimEnd());
          }
        }
      }

      if (markerIndex !== -1) {
        const jsonPart = buffer.slice(markerIndex + DIAGNOSIS_MARKER.length).trim();
        try {
          const payload = JSON.parse(jsonPart) as DiagnosisMarkerPayload;
          const persona = getPersonaByKey(payload.personaKey);
          setDiagnosisResult({
            personaEmoji: persona?.emoji ?? "🎯",
            personaName: payload.personaName,
            description: payload.description,
            benefits: payload.benefits,
            totalMonthlySaving: payload.totalMonthlySaving,
            totalYearlySaving: payload.totalYearlySaving,
          });
        } catch (parseError) {
          console.error("Failed to parse diagnosis result payload", parseError);
        }
      }
    } catch (error) {
      console.error("Failed to reach /api/diagnose", error);
      updateAssistantMessage(assistantId, "네트워크 오류로 답변을 받지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleRestart = () => {
    sessionIdRef.current = null;
    setMessages(createInitialMessages());
    setInput("");
    setIsTyping(false);
    setDiagnosisResult(null);
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
          {messages.map((message) =>
            message.content ? <ChatBubble key={message.id} message={message} /> : null,
          )}
          {isTyping && messages[messages.length - 1]?.content === "" && <TypingIndicator />}
          <div ref={scrollAnchorRef} />
        </div>
      </div>

      {diagnosisResult ? (
        <div className="mx-auto w-full max-w-2xl">
          <DiagnosisResultTeaser result={diagnosisResult} onRestart={handleRestart} />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl">
          <ChatInputBar value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} />
        </div>
      )}
    </div>
  );
}
