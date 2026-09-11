import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * 서버 전용 Supabase 클라이언트. service role 키로 RLS를 우회해 접근한다.
 * app/api/ 라우트 핸들러 등 서버 코드에서만 사용할 것 — 클라이언트 컴포넌트에서 import 금지
 * (service role 키가 브라우저 번들에 노출되면 안 됨. docs/database-schema.md의 RLS 방침 참고).
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다. .env.local을 확인해주세요.",
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
