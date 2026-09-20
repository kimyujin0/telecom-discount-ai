"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AnalyzingChecklist from "./AnalyzingChecklist";
import DiagnosisResult, { type DiagnosisResultData } from "./DiagnosisResult";
import FollowUpQuestion from "./FollowUpQuestion";
import FreeTextInput from "./FreeTextInput";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  buildDiagnosisResumePath,
  DIAGNOSIS_CHAT_PATH,
  isUuid,
  type ResumableDiagnosis,
} from "@/lib/diagnosis/resume";

// "AI 분석 중" 체크리스트 연출이 너무 순식간에 지나가 보이지 않도록 최소 노출 시간을 보장한다.
const ANALYZING_MIN_MS = 2000;

// 소개 페이지(app/diagnosis/page.tsx)에서 CTA를 눌러 이미 /diagnosis/chat으로 넘어온 뒤이므로,
// 이 컴포넌트는 인트로 없이 바로 자유 입력 단계에서 시작한다.
type Phase = "input" | "analyzing" | "followup" | "result" | "restoring";

interface FollowUpState {
  question: string;
  quickReplies: string[];
}

interface DiagnoseSuccessBody {
  sessionId: string;
  done: boolean;
  question?: string;
  quickReplies?: string[];
  personaTagline?: string;
  totalMonthlySaving?: number;
  totalYearlySaving?: number;
  benefits?: DiagnosisResultData["benefits"];
}

export default function DiagnosisExperience({ initialResume = null }: { initialResume?: ResumableDiagnosis | null }) {
  // 주소창의 ?session= (서버가 이미 복원해 initialResume으로 내려줬다면 그걸 쓴다).
  const urlSession = useSearchParams().get("session");
  // ?session=... 으로 돌아온 경우 입력 단계를 거치지 않고 저장돼 있던 결과 화면에서 바로 시작한다.
  // 주소에는 세션이 있는데 서버가 결과를 못 내려준 경우는 "뒤로가기"로 돌아온 것 — Next가 그 히스토리 항목의
  // 예전 서버 화면(세션 없는 /diagnosis/chat)을 캐시에서 되살려서 서버 조회를 건너뛴 것이라, 아래 effect에서
  // 클라이언트가 직접 결과를 다시 가져온다(그동안은 "불러오는 중").
  const [phase, setPhase] = useState<Phase>(initialResume ? "result" : isUuid(urlSession) ? "restoring" : "input");
  const [followUp, setFollowUp] = useState<FollowUpState | null>(null);
  const [result, setResult] = useState<DiagnosisResultData | null>(initialResume?.result ?? null);
  // 지금 보여주는 결과의 세션 id — 비로그인 상태에서 저장 버튼을 누르면 로그인 후 이 결과로 돌아오는 데 쓴다.
  const [resultSessionId, setResultSessionId] = useState<string | null>(initialResume?.sessionId ?? null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef("");

  useEffect(() => {
    if (phase !== "restoring" || !urlSession) return;
    let active = true;

    const giveUp = () => {
      if (!active) return;
      // 내 세션이 아니거나 결과가 없으면 조용히 새 진단 화면으로 — 죽은 세션 id는 주소창에서도 지운다.
      window.history.replaceState(null, "", DIAGNOSIS_CHAT_PATH);
      setPhase("input");
    };

    fetch(`/api/diagnose/resume?session=${encodeURIComponent(urlSession)}`, { cache: "no-store" })
      .then(async (response) => {
        // 404여도 본문은 끝까지 읽는다 — 안 읽고 버리면 브라우저가 그 요청을 끝나지 않은 것으로 계속 붙들고 있다.
        const body = (await response.json().catch(() => null)) as ResumableDiagnosis | null;
        return response.ok ? body : null;
      })
      .then((data) => {
        if (!active) return;
        if (!data) return giveUp();
        setResult(data.result);
        setResultSessionId(data.sessionId);
        setPhase("result");
      })
      .catch(giveUp);

    return () => {
      active = false;
    };
  }, [phase, urlSession]);

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
        personaTagline: body.personaTagline ?? "",
        totalMonthlySaving: body.totalMonthlySaving ?? 0,
        totalYearlySaving: body.totalYearlySaving ?? 0,
        benefits: body.benefits ?? [],
      });
      setResultSessionId(body.sessionId);
      // 주소창에 결과의 세션 id를 남겨둔다 — 새로고침이나 로그인 화면에서 뒤로가기로 돌아와도 같은 결과가
      // 복원된다. 이 브라우저가 만든 세션일 때만 복원되므로 URL이 공유돼도 다른 사람에게는 보이지 않는다.
      window.history.replaceState(null, "", buildDiagnosisResumePath(body.sessionId));
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
    setResultSessionId(null);
    setErrorText(null);
    // 새 진단을 시작하니 주소창의 이전 결과 세션 id는 지운다(새로고침하면 옛 결과가 다시 뜨지 않게).
    window.history.replaceState(null, "", DIAGNOSIS_CHAT_PATH);
    setPhase("input");
  };

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

          {phase === "restoring" && (
            <p className="rounded-3xl border border-zinc-200 bg-white px-6 py-10 text-center text-sm font-medium text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              진단 결과를 불러오는 중이에요…
            </p>
          )}
          {phase === "input" && <FreeTextInput onSubmit={runDiagnose} />}
          {phase === "analyzing" && <AnalyzingChecklist />}
          {phase === "followup" && followUp && (
            <FollowUpQuestion question={followUp.question} quickReplies={followUp.quickReplies} onAnswer={runDiagnose} />
          )}
          {phase === "result" && result && <DiagnosisResult result={result} sessionId={resultSessionId} onRestart={handleRestart} />}
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
