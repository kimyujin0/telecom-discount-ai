import type { DiagnosisResultData } from "@/components/diagnosis/DiagnosisResult";
import { getCurrentUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readAnonymousKey } from "./anonymousKey";
import { claimAnonymousSession } from "./claimSession";
import { isUuid, type ResumableDiagnosis } from "./resume";

// /diagnosis/chat?session=<uuid> 로 돌아왔을 때 이미 끝난 진단 결과를 다시 만들어 보여주기 위한 조회.
// 재진단 없이 "저장돼 있던 결과 그대로"를 읽는다 — LLM을 다시 부르지 않는다.
//
// diagnosis_*는 RLS deny-all이라 service role로 읽되, 남의 진단이 URL만 바꿔서 보이지 않도록
// "이 사용자/브라우저의 세션인가"를 여기서 직접 검사한다.

interface BenefitJoin {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  category: string | null;
  persona_category: string | null;
}

export async function loadResumableDiagnosis(rawSessionId: string | undefined): Promise<ResumableDiagnosis | null> {
  // 형식이 다르면 DB를 건드리지 않고 끝낸다.
  if (!isUuid(rawSessionId)) return null;
  const sessionId = rawSessionId;

  try {
    const supabase = getSupabaseServerClient();

    const { data: session, error: sessionError } = await supabase
      .from("diagnosis_sessions")
      .select("id, user_id, anonymous_key")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionError) {
      console.error("[resume] failed to load session", sessionError);
      return null;
    }
    if (!session) return null;

    // ── 소유권: 내 계정의 세션이거나, 이 브라우저(쿠키 키)가 만든 비로그인 세션이어야 한다.
    // 어느 쪽도 아니면 "없는 세션"과 똑같이 null — 남의 세션 id가 유효한지 알려주지 않는다.
    const authUser = await getCurrentUser();
    if (session.user_id) {
      if (authUser?.id !== session.user_id) return null;
    } else {
      const anonymousKey = await readAnonymousKey();
      if (!anonymousKey || session.anonymous_key !== anonymousKey) return null;
      // 로그인한 채로 돌아왔는데 아직 계정에 안 붙어 있다면(로그인 액션에서 놓쳤을 때 등) 지금 붙인다.
      if (authUser) await claimAnonymousSession(authUser.id, sessionId);
    }

    const { data: resultRow, error: resultError } = await supabase
      .from("diagnosis_results")
      .select("id, raw_model_output")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (resultError) {
      console.error("[resume] failed to load result", resultError);
      return null;
    }
    // 아직 결과가 나오기 전(진행 중) 세션은 복원할 게 없다.
    if (!resultRow) return null;

    const { data: benefitRows, error: benefitError } = await supabase
      .from("diagnosis_result_benefits")
      .select("rank, estimated_monthly_saving, reason, benefits!inner(id, provider, carrier, title, category, persona_category)")
      .eq("diagnosis_result_id", resultRow.id)
      .order("rank", { ascending: true });
    if (benefitError) {
      console.error("[resume] failed to load result benefits", benefitError);
      return null;
    }

    const benefits: DiagnosisResultData["benefits"] = [];
    for (const row of benefitRows ?? []) {
      // to-one 임베드는 객체로 오지만, 생성된 DB 타입이 없어 추론이 배열로 잡히는 경우가 있어 둘 다 받는다.
      const embedded = row.benefits as BenefitJoin | BenefitJoin[] | null;
      const benefit = Array.isArray(embedded) ? embedded[0] : embedded;
      if (!benefit) continue;

      benefits.push({
        id: benefit.id,
        provider: benefit.provider,
        carrier: benefit.carrier,
        title: benefit.title,
        // app/api/diagnose/route.ts의 응답과 같은 규칙 — 카테고리가 없으면 persona_category로 대체.
        category: benefit.category ?? benefit.persona_category,
        // 진단 시점 스냅샷 값을 쓴다(카탈로그가 나중에 바뀌어도 그때 보여준 그대로).
        estimatedMonthlySaving: row.estimated_monthly_saving as number,
        reason: (row.reason as string | null) ?? "",
      });
    }

    const totalMonthlySaving = benefits.reduce((sum, b) => sum + b.estimatedMonthlySaving, 0);
    const rawOutput = resultRow.raw_model_output as { extraction?: { personaTagline?: string } } | null;

    return {
      sessionId,
      result: {
        // 태그라인은 별도 컬럼이 없고 진단 당시 LLM 추출 결과(raw_model_output)에 들어 있다.
        personaTagline: rawOutput?.extraction?.personaTagline ?? "",
        totalMonthlySaving,
        totalYearlySaving: totalMonthlySaving * 12,
        benefits,
      },
    };
  } catch (error) {
    console.error("[resume] unexpected error restoring diagnosis", error);
    return null;
  }
}
