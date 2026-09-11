// 6종 페르소나 정의 — CLAUDE.md 기준 문서와 일치해야 한다.
// 서버(시스템 프롬프트 생성)와 클라이언트(결과 카드 이모지/이름 표시) 양쪽에서 공유하는 단일 소스.
// personas 테이블(supabase/migrations/0001_init_schema.sql)의 key와 반드시 일치해야 한다.

export type PersonaKey =
  | "media_lover"
  | "practical_living"
  | "travel_nomad"
  | "caffeine_charger"
  | "mobility"
  | "balance";

export interface PersonaDefinition {
  key: PersonaKey;
  name: string;
  emoji: string;
  /** 시스템 프롬프트에 명시할 대표 소비 카테고리 */
  representativeCategory: string;
  /** 시스템 프롬프트용 성향 힌트 (고객 노출 문구 아님) */
  traitHint: string;
}

export const PERSONAS: PersonaDefinition[] = [
  {
    key: "media_lover",
    name: "미디어러버",
    emoji: "🎬",
    representativeCategory: "미디어/콘텐츠 구독 (OTT, 음악 스트리밍)",
    traitHint: "OTT/영상 스트리밍 소비가 많고 콘텐츠 구독에 지출을 아끼지 않음",
  },
  {
    key: "practical_living",
    name: "실속형 생활러",
    emoji: "🧾",
    representativeCategory: "생활비/공과금 절감",
    traitHint: "통신비를 포함한 고정비 절감에 민감하고 실용적인 소비를 선호",
  },
  {
    key: "travel_nomad",
    name: "여행형 노마드",
    emoji: "✈️",
    representativeCategory: "여행/이동 (로밍, 항공, 숙박)",
    traitHint: "국내외 이동과 여행 빈도가 높고 로밍/데이터 사용이 잦음",
  },
  {
    key: "caffeine_charger",
    name: "카페인 충전러",
    emoji: "☕",
    representativeCategory: "카페/편의점 소액 결제",
    traitHint: "카페/편의점 소비 빈도가 높고 일상 소액 결제가 잦음",
  },
  {
    key: "mobility",
    name: "모빌리티형",
    emoji: "🚗",
    representativeCategory: "이동수단 (대중교통, 차량, 공유 모빌리티)",
    traitHint: "대중교통, 차, 공유 모빌리티 등 이동 관련 지출 비중이 큼",
  },
  {
    key: "balance",
    name: "밸런스형",
    emoji: "⚖️",
    representativeCategory: "전반적으로 균형 잡힌 소비",
    traitHint: "특정 카테고리에 편중되지 않고 소비가 고르게 분산됨",
  },
];

export function getPersonaByKey(key: string): PersonaDefinition | undefined {
  return PERSONAS.find((p) => p.key === key);
}
