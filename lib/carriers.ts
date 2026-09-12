// 통신사 값의 단일 소스(SSOT). benefits.carrier / diagnosis_sessions.carrier 컬럼의 체크 제약과
// 반드시 동일해야 한다.
// 참고: supabase/migrations/0002_add_benefits_carrier.sql, 0003_add_diagnosis_sessions_carrier.sql
export const CARRIERS = ["KT", "SKT", "U+", "알뜰폰"] as const;

export type CarrierKey = (typeof CARRIERS)[number];

export function isCarrierKey(value: unknown): value is CarrierKey {
  return typeof value === "string" && (CARRIERS as readonly string[]).includes(value);
}
