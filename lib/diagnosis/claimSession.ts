import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readAnonymousKey } from "./anonymousKey";
import { isUuid } from "./resume";

/**
 * 비로그인으로 진행한 진단 세션을 방금 로그인한 사용자의 것으로 연결(claim)한다.
 * 그러면 마이페이지 진단 이력(diagnosis_sessions.user_id 기준)에 이 진단이 남는다.
 *
 * 조건이 전부 맞을 때만 연결된다:
 *   - sessionId가 UUID 형식이고
 *   - 세션이 아직 누구의 것도 아니며(user_id is null)
 *   - 세션의 anonymous_key가 이 요청 쿠키의 키와 같다 (= 이 브라우저에서 만든 세션이다)
 * 조건 검사와 갱신을 UPDATE 한 문장의 WHERE로 묶어, 두 요청이 동시에 와도 한 사람만 가져간다.
 *
 * 연결하면 anonymous_key는 비운다 — diagnosis_sessions_owner_check(user_id 또는 anonymous_key 중 하나는
 * 있어야 함)는 user_id가 생겼으므로 만족하고, 로그인 사용자 세션은 원래 anonymous_key가 null이다.
 *
 * 로그인 자체를 막으면 안 되므로 실패는 던지지 않고 false로 돌려준다.
 */
export async function claimAnonymousSession(userId: string, sessionId: string): Promise<boolean> {
  if (!isUuid(sessionId)) return false;

  try {
    const anonymousKey = await readAnonymousKey();
    if (!anonymousKey) return false;

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("diagnosis_sessions")
      .update({ user_id: userId, anonymous_key: null })
      .eq("id", sessionId)
      .is("user_id", null)
      .eq("anonymous_key", anonymousKey)
      .select("id");

    if (error) {
      console.error("[diagnosis] failed to claim anonymous session", error);
      return false;
    }
    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error("[diagnosis] unexpected error claiming anonymous session", error);
    return false;
  }
}
