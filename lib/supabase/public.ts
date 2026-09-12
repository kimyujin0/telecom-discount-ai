import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * 공개 anon 키 기반 Supabase 클라이언트. service role과 달리 RLS를 우회하지 않고
 * public read 정책(예: benefits_public_read)을 그대로 따른다.
 * 로그인 없이 노출되는 카탈로그성 데이터(예: app/carriers) 조회 전용으로 서버 컴포넌트에서 사용한다.
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY 환경변수가 설정되어 있지 않습니다. .env.local을 확인해주세요.",
    );
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
