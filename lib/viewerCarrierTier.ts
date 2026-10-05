import { unwrapToOne } from "@/lib/diagnosisHistory";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isCarrierKey, type CarrierKey } from "./carriers";

// "지금 쓸 수 있는 혜택" 섹션이 로그인 사용자의 통신사·등급을 무엇으로 볼지 정하는 단일 지점.
//
// 우선순위:
//   1) 최근 진단 결과(diagnosis_results → diagnosis_sessions.carrier/tier) — 가장 최신·구체적인 답변.
//      등급을 "모름"으로 답했을 수도 있는데, 그 경우 tier는 TIER_UNKNOWN("모름")으로 그대로 둔다
//      (등급 조건을 걸지 않고 전 등급 혜택까지 보여주는 쪽은 호출부의 tierAllows()가 담당).
//   2) 진단 이력이 없거나 거기서 통신사를 확인하지 못했으면 profiles.carrier(가입 시 선택값).
//      이 경우 등급은 알 수 없으니 tier=null.
//   3) 둘 다 없으면 carrier=null — 호출부가 선택 UI로 안내해야 한다.
//
// diagnosis_results/diagnosis_sessions는 RLS가 deny-all이라(0001_init_schema.sql) 세션 클라이언트로는
// 못 읽는다 — lib/diagnosisHistory.ts와 같은 이유로 service role 클라이언트를 쓰고, 반드시
// diagnosis_sessions.user_id = 본인 id 조건을 걸어 다른 사용자 데이터가 섞이지 않게 한다.
// profiles는 RLS가 본인 행만 허용하므로 세션 클라이언트(createSupabaseAuthClient)를 그대로 쓴다.

export interface ViewerCarrierTier {
  carrier: CarrierKey | null;
  tier: string | null;
  source: "diagnosis" | "profile" | "none";
}

export async function resolveViewerCarrierTier(userId: string): Promise<ViewerCarrierTier> {
  const serviceRole = getSupabaseServerClient();

  const { data: result, error: resultError } = await serviceRole
    .from("diagnosis_results")
    .select("created_at, diagnosis_sessions!inner(user_id, carrier, tier)")
    .eq("diagnosis_sessions.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resultError) console.error("[viewerCarrierTier] failed to load latest diagnosis result", resultError);

  const session = unwrapToOne(
    result?.diagnosis_sessions as { carrier: string | null; tier: string | null } | { carrier: string | null; tier: string | null }[] | null,
  );
  if (session?.carrier && isCarrierKey(session.carrier)) {
    return { carrier: session.carrier, tier: session.tier ?? null, source: "diagnosis" };
  }

  const authClient = await createSupabaseAuthClient();
  const { data: profile, error: profileError } = await authClient.from("profiles").select("carrier").eq("id", userId).maybeSingle();
  if (profileError) console.error("[viewerCarrierTier] failed to load profile carrier", profileError);

  if (profile?.carrier && isCarrierKey(profile.carrier)) {
    return { carrier: profile.carrier, tier: null, source: "profile" };
  }

  return { carrier: null, tier: null, source: "none" };
}
