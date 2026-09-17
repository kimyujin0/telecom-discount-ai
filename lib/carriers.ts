// 통신사 값의 단일 소스(SSOT). benefits.carrier / diagnosis_sessions.carrier 컬럼의 체크 제약과
// 반드시 동일해야 한다.
// 참고: supabase/migrations/0002_add_benefits_carrier.sql, 0003_add_diagnosis_sessions_carrier.sql
export const CARRIERS = ["KT", "SKT", "U+", "알뜰폰"] as const;

export type CarrierKey = (typeof CARRIERS)[number];

export function isCarrierKey(value: unknown): value is CarrierKey {
  return typeof value === "string" && (CARRIERS as readonly string[]).includes(value);
}

/**
 * 화면에 노출할 통신사 표기. carrier 키는 DB 필터링용 정규화 값이라("U+") 사용자에게 보여줄 때는
 * 익숙한 표기("LG U+")를 쓴다. 회원가입 통신사 선택, 마이페이지 등 UI 전반에서 이 맵을 따른다.
 */
export const CARRIER_LABELS: Record<CarrierKey, string> = {
  SKT: "SKT",
  KT: "KT",
  "U+": "LG U+",
  알뜰폰: "알뜰폰",
};

/** 선택 UI에 노출하는 순서 — 목업/헤로 탭과 동일하게 SKT를 먼저 둔다. */
export const CARRIER_OPTIONS: CarrierKey[] = ["SKT", "KT", "U+", "알뜰폰"];

/**
 * CARRIER_LABELS 표기 뒤에 붙일 목적격 조사(을/를). "SKT"(에스케이티), "KT"(케이티), "LG U+"(유플러스)는
 * 모두 모음으로 끝나는 발음이라 "를", "알뜰폰"은 받침 있는 발음이라 "을"을 쓴다. 영문 표기라 받침을
 * 코드로 판정할 수 없어 고정 목록으로 관리한다 — 대화 질문 문구(lib/chat/slots.ts)에서 쓴다.
 */
export const CARRIER_OBJECT_PARTICLE: Record<CarrierKey, "을" | "를"> = {
  SKT: "를",
  KT: "를",
  "U+": "를",
  알뜰폰: "을",
};
