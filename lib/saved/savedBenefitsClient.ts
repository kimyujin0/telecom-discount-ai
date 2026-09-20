import type { SupabaseClient } from "@supabase/supabase-js";

// saved_benefits(0010_create_saved_benefits.sql) 쓰기 헬퍼 — 브라우저(anon 키 + 로그인 세션) 전용.
// 본인 행만 넣고 지울 수 있다는 보장은 코드가 아니라 테이블의 RLS 정책이 한다. 여기서 user_id를 함께
// 넘기는 건 insert 정책(with check auth.uid() = user_id)과 delete 조건을 명시적으로 맞추기 위해서다.

const UNIQUE_VIOLATION = "23505";

export async function saveBenefit(supabase: SupabaseClient, userId: string, benefitId: string): Promise<boolean> {
  const { error } = await supabase.from("saved_benefits").insert({ user_id: userId, benefit_id: benefitId });
  // 다른 탭/기기에서 이미 저장했으면 PK 충돌이 나는데, 결과적으로 "저장된 상태"이므로 성공으로 본다.
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("[saved] failed to save benefit", error);
    return false;
  }
  return true;
}

export async function unsaveBenefit(supabase: SupabaseClient, userId: string, benefitId: string): Promise<boolean> {
  const { error } = await supabase
    .from("saved_benefits")
    .delete()
    .eq("user_id", userId)
    .eq("benefit_id", benefitId);
  if (error) {
    console.error("[saved] failed to unsave benefit", error);
    return false;
  }
  return true;
}
