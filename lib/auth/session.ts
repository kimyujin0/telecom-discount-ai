import { redirect } from "next/navigation";
import { isCarrierKey, type CarrierKey } from "@/lib/carriers";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";
import { carrierFromUserMetadata, resolveNickname, type AppUser } from "./user";

// 서버 전용 인증 데이터 접근 계층(DAL). 세션 확인을 여기 한 곳으로 모아, 페이지/서버 액션/라우트
// 핸들러가 각자 쿠키를 파싱하지 않게 한다.
//
// getUser()는 매번 Supabase Auth 서버에 토큰을 검증받는다(getSession()은 쿠키 값을 그대로 믿기
// 때문에 서버 측 권한 판단에 쓰면 위조 가능). 그래서 여기서는 항상 getUser()를 쓴다.

/** 로그인 사용자를 반환하고, 비로그인이면 null. 리다이렉트하지 않으므로 UI 분기용으로 쓴다. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // profiles가 정본. RLS(profiles_select_own)로 본인 행만 보이므로 anon 키 클라이언트로 조회해도 안전하다.
  let carrier: CarrierKey | null = null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("carrier, nickname, name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // 마이그레이션(0006/0008) 미적용 등으로 profiles를 못 읽어도 로그인 자체는 막지 않는다.
    console.error("[auth] failed to load profile", profileError);
  } else if (profile && isCarrierKey(profile.carrier)) {
    carrier = profile.carrier;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    nickname: resolveNickname(profile?.nickname, user.email),
    name: profile?.name ?? null,
    carrier: carrier ?? carrierFromUserMetadata(user.user_metadata),
  };
}

/**
 * 로그인 필수 페이지용. 비로그인이면 /login으로 보내며, 로그인 후 원래 가려던 곳으로 되돌아올 수
 * 있도록 next 파라미터를 붙인다.
 */
export async function requireUser(nextPath: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
