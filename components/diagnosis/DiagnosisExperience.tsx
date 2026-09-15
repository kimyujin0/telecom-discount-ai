"use client";

import { useRef, useState } from "react";
import AnalyzingChecklist from "./AnalyzingChecklist";
import DiagnosisIntro from "./DiagnosisIntro";
import DiagnosisResult, { type DiagnosisResultData } from "./DiagnosisResult";
import FollowUpQuestion from "./FollowUpQuestion";
import FreeTextInput from "./FreeTextInput";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

// "AI 분석 중" 체크리스트 연출이 너무 순식간에 지나가 보이지 않도록 최소 노출 시간을 보장한다.
const ANALYZING_MIN_MS = 2000;

type Phase = "intro" | "input" | "analyzing" | "followup" | "result";

interface FollowUpState {
  question: string;
  quickReplies: string[];
}

interface DiagnoseSuccessBody {
  sessionId: string;
  done: boolean;
  question?: string;
  quickReplies?: string[];
  totalMonthlySaving?: number;
  totalYearlySaving?: number;
  benefits?: DiagnosisResultData["benefits"];
}

export default function DiagnosisExperience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [followUp, setFollowUp] = useState<FollowUpState | null>(null);
  const [result, setResult] = useState<DiagnosisResultData | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef("");

  const runDiagnose = async (message: string) => {
    const startedAt = Date.now();
    lastMessageRef.current = message;
    setErrorText(null);
    setPhase("analyzing");

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message }),
      });

      const body = (await response.json().catch(() => null)) as DiagnoseSuccessBody | { error: string } | null;

      if (!response.ok || !body || "error" in body) {
        const message2 = body && "error" in body ? body.error : "진단 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";
        await waitForMinDuration(startedAt);
        setErrorText(message2);
        setPhase(followUp ? "followup" : "input");
        return;
      }

      sessionIdRef.current = body.sessionId;
      await waitForMinDuration(startedAt);

      if (!body.done) {
        setFollowUp({ question: body.question ?? "", quickReplies: body.quickReplies ?? [] });
        setPhase("followup");
        return;
      }

      setResult({
        totalMonthlySaving: body.totalMonthlySaving ?? 0,
        totalYearlySaving: body.totalYearlySaving ?? 0,
        benefits: body.benefits ?? [],
      });
      setPhase("result");
    } catch (error) {
      console.error("Failed to reach /api/diagnose", error);
      await waitForMinDuration(startedAt);
      setErrorText("네트워크 오류로 답변을 받지 못했어요. 다시 시도해주세요.");
      setPhase(followUp ? "followup" : "input");
    }
  };

  const handleRestart = () => {
    sessionIdRef.current = null;
    lastMessageRef.current = "";
    setFollowUp(null);
    setResult(null);
    setErrorText(null);
    setPhase("intro");
  };

  if (phase === "intro") {
    return (
      <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
        <SiteHeader active="diagnosis" />
        <main className="flex-1">
          <DiagnosisIntro onStart={() => setPhase("input")} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader active="diagnosis" />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl">
          {errorText && (
            <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {errorText}
            </p>
          )}

          {phase === "input" && <FreeTextInput onSubmit={runDiagnose} />}
          {phase === "analyzing" && <AnalyzingChecklist />}
          {phase === "followup" && followUp && (
            <FollowUpQuestion question={followUp.question} quickReplies={followUp.quickReplies} onAnswer={runDiagnose} />
          )}
          {phase === "result" && result && <DiagnosisResult result={result} onRestart={handleRestart} />}
        </div>
      </main>
    </div>
  );
}

async function waitForMinDuration(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const remaining = ANALYZING_MIN_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }
}
