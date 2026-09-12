"use client";

import { BadgePercent } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import DiagnosisResultTeaser, { type DiagnosisResultData } from "./DiagnosisResultTeaser";
import { CARRIERS, type CarrierKey } from "@/lib/carriers";
import { AI_INTRO_MESSAGE, INITIAL_GREETING } from "@/lib/chat/constants";
import { getPersonaByKey, PERSONAS } from "@/lib/chat/personas";
import { MAX_TURNS } from "@/lib/chat/system-prompt";

const DIAGNOSIS_MARKER = "<<<DIAGNOSIS_RESULT_JSON>>>";
// 카드가 사라졌다 나타나는 전환 애니메이션의 절반 구간 길이(ms). Tailwind duration과 맞춰둔다.
const TRANSITION_MS = 220;
// 진단 마무리 멘트를 사용자가 다 읽을 수 있도록, 결과 카드로 넘어가기 전 잠깐 멈춰준다.
const RESULT_REVEAL_DELAY_MS = 900;
// 진단 질문 흐름 맨 처음, AI 자기소개 다음에 묻는 통신사 질문. 이 답변은 diagnosis_sessions.carrier로
// 저장되어 진단 완료 후 혜택 매칭(UC-02)에서 반드시 이 통신사와 일치하는 혜택만 추천하는 데 쓰인다.
const CARRIER_QUESTION = "어느 통신사를 이용하시나요? (KT/SKT/U+/알뜰폰)";

interface DiagnosisMarkerPayload {
  done: true;
  personaKey: string;
  personaName: string;
  description: string;
  benefits: { provider: string; title: string; monthlySaving: number }[];
  totalMonthlySaving: number;
  totalYearlySaving: number;
}

// 질문 화면에서 빠르게 고를 수 있는 기본 선택지. 6개 페르소나의 대표 소비 카테고리를 그대로 활용해,
// 클릭만으로도 진단에 실제로 쓰이는 신호를 자유 텍스트 답변과 동일한 방식으로 전달한다.
const QUICK_REPLIES = PERSONAS.map((persona) => ({
  key: persona.key,
  emoji: persona.emoji,
  label: persona.representativeCategory.split(" (")[0],
  value: persona.representativeCategory,
}));

type Phase = "intro" | "carrier" | "question" | "result";

export default function TypeformDiagnosis() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [screenText, setScreenText] = useState(AI_INTRO_MESSAGE);
  const [isStreaming, setIsStreaming] = useState(false);
  const [answer, setAnswer] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResultData | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef("");
  const carrierRef = useRef<CarrierKey | null>(null);

  // 카드를 살짝 내려서 지운 뒤, 다음 내용으로 바꾸고 다시 올려 보여주는 전환 애니메이션.
  const transitionTo = (update: () => void) => {
    setCardVisible(false);
    window.setTimeout(() => {
      update();
      requestAnimationFrame(() => requestAnimationFrame(() => setCardVisible(true)));
    }, TRANSITION_MS);
  };

  const handleStart = () => {
    transitionTo(() => {
      setPhase("carrier");
      setScreenText(CARRIER_QUESTION);
    });
  };

  const handleCarrierSelect = (value: CarrierKey) => {
    carrierRef.current = value;
    transitionTo(() => {
      setPhase("question");
      setScreenText(INITIAL_GREETING);
    });
  };

  const runDiagnose = async (message: string) => {
    try {
      const isFirstRequest = sessionIdRef.current === null;
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message,
          ...(isFirstRequest ? { carrier: carrierRef.current } : {}),
        }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.json().catch(() => null);
        setErrorText(errorBody?.error ?? "진단 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
        setIsStreaming(false);
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
              setScreenText(buffer.slice(0, rendered));
            }
          } else {
            markerIndex = idx;
            rendered = buffer.length;
            setScreenText(buffer.slice(0, markerIndex).trimEnd());
          }
        }
      }

      if (markerIndex !== -1) {
        const jsonPart = buffer.slice(markerIndex + DIAGNOSIS_MARKER.length).trim();
        try {
          const payload = JSON.parse(jsonPart) as DiagnosisMarkerPayload;
          const persona = getPersonaByKey(payload.personaKey);
          const result: DiagnosisResultData = {
            personaEmoji: persona?.emoji ?? "🎯",
            personaName: payload.personaName,
            description: payload.description,
            benefits: payload.benefits,
            totalMonthlySaving: payload.totalMonthlySaving,
            totalYearlySaving: payload.totalYearlySaving,
          };
          window.setTimeout(() => {
            transitionTo(() => {
              setPhase("result");
              setDiagnosisResult(result);
              setIsStreaming(false);
            });
          }, RESULT_REVEAL_DELAY_MS);
          return;
        } catch (parseError) {
          console.error("Failed to parse diagnosis result payload", parseError);
        }
      }

      setIsStreaming(false);
    } catch (error) {
      console.error("Failed to reach /api/diagnose", error);
      setErrorText("네트워크 오류로 답변을 받지 못했어요. 다시 시도해주세요.");
      setIsStreaming(false);
    }
  };

  const handleSubmit = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isStreaming) return;

    lastMessageRef.current = trimmed;
    setErrorText(null);
    setAnswer("");
    setTurnCount((n) => n + 1);

    transitionTo(() => {
      setScreenText("");
      setIsStreaming(true);
      void runDiagnose(trimmed);
    });
  };

  const handleRetry = () => {
    if (!lastMessageRef.current || isStreaming) return;
    setErrorText(null);
    setIsStreaming(true);
    void runDiagnose(lastMessageRef.current);
  };

  const handleRestart = () => {
    sessionIdRef.current = null;
    lastMessageRef.current = "";
    carrierRef.current = null;
    setTurnCount(0);
    setAnswer("");
    setErrorText(null);
    setIsStreaming(false);
    setDiagnosisResult(null);
    transitionTo(() => {
      setPhase("intro");
      setScreenText(AI_INTRO_MESSAGE);
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <TypeformHeader />
      {phase === "question" && <ProgressBar progress={Math.min(turnCount / MAX_TURNS, 1)} />}

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div
          className={`w-full max-w-xl transition-all duration-200 ease-out ${
            cardVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {phase === "intro" && <IntroCard onStart={handleStart} />}

          {phase === "carrier" && (
            <CarrierQuestionCard question={screenText} onSelect={handleCarrierSelect} />
          )}

          {phase === "question" && (
            <QuestionCard
              text={screenText}
              isStreaming={isStreaming}
              errorText={errorText}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={() => handleSubmit(answer)}
              onQuickReply={handleSubmit}
              onRetry={handleRetry}
            />
          )}

          {phase === "result" && diagnosisResult && (
            <DiagnosisResultTeaser result={diagnosisResult} onRestart={handleRestart} />
          )}
        </div>
      </main>
    </div>
  );
}

function TypeformHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-400 text-white">
            <BadgePercent className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">내게맞는할인</span>
        </Link>
      </div>
    </header>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
      <div
        className="h-full bg-indigo-600 transition-all duration-500 ease-out"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}

function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white">
        🤖
      </div>
      <p className="mt-6 text-lg leading-relaxed font-semibold text-zinc-900 sm:text-xl dark:text-zinc-50">
        {AI_INTRO_MESSAGE}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
      >
        시작할게요
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

function CarrierQuestionCard({
  question,
  onSelect,
}: {
  question: string;
  onSelect: (value: CarrierKey) => void;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm text-white">
          🤖
        </span>
        <p className="flex-1 pt-1 text-lg leading-relaxed font-semibold text-zinc-900 sm:text-xl dark:text-zinc-50">
          {question}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {CARRIERS.map((carrier) => (
          <button
            key={carrier}
            type="button"
            onClick={() => onSelect(carrier)}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 py-3.5 text-base font-bold text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
          >
            {carrier}
          </button>
        ))}
      </div>
    </div>
  );
}

interface QuestionCardProps {
  text: string;
  isStreaming: boolean;
  errorText: string | null;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onQuickReply: (value: string) => void;
  onRetry: () => void;
}

function QuestionCard({
  text,
  isStreaming,
  errorText,
  answer,
  onAnswerChange,
  onSubmit,
  onQuickReply,
  onRetry,
}: QuestionCardProps) {
  const showControls = !isStreaming && !errorText && text.length > 0;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm text-white">
          🤖
        </span>
        <p className="min-h-[3.5rem] flex-1 pt-1 text-lg leading-relaxed font-semibold whitespace-pre-wrap text-zinc-900 sm:text-xl dark:text-zinc-50">
          {errorText ?? text}
          {isStreaming && text.length > 0 && (
            <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 animate-pulse bg-indigo-500 align-middle" />
          )}
        </p>
      </div>

      {isStreaming && text.length === 0 && !errorText && (
        <div className="mt-3 ml-12">
          <TypingDots />
        </div>
      )}

      {errorText && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 w-full rounded-full border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          다시 시도하기
        </button>
      )}

      {showControls && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply.key}
                type="button"
                onClick={() => onQuickReply(reply.value)}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
              >
                <span aria-hidden>{reply.emoji}</span>
                {reply.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            직접 입력할래요
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <AnswerInput value={answer} onChange={onAnswerChange} onSubmit={onSubmit} />
        </div>
      )}
    </div>
  );
}

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

function AnswerInput({ value, onChange, onSubmit }: AnswerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      onSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="자유롭게 답변을 입력해주세요..."
        className="max-h-32 flex-1 resize-none rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-900/40"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={value.trim().length === 0}
        className="flex h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-indigo-600 px-5 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        다음
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
    </span>
  );
}
