import type { BenefitCategory } from "@/lib/carrierBenefitCategories";

// 진단 슬롯 정의 — app/api/diagnose가 대화에서 추출하는 구조화된 정보의 단일 소스(SSOT).
// 서버(구조화 출력 스키마)와 클라이언트(빠른 선택지 기본값) 양쪽에서 공유한다.

export const DATA_USAGE_VALUES = ["많음", "보통", "적음"] as const;
export type DataUsageValue = (typeof DATA_USAGE_VALUES)[number];

export const OTT_USAGE_VALUES = ["있음", "없음"] as const;
export type OttUsageValue = (typeof OTT_USAGE_VALUES)[number];

export const OVERSEAS_USAGE_VALUES = ["자주", "가끔", "거의없음"] as const;
export type OverseasUsageValue = (typeof OVERSEAS_USAGE_VALUES)[number];

export type CoreSlotKey = "dataUsage" | "ottUsage" | "overseasUsage";

export interface DiagnosisSlots {
  dataUsage: DataUsageValue | null;
  ottUsage: OttUsageValue | null;
  ottServices: string[];
  overseasUsage: OverseasUsageValue | null;
  interestCategories: BenefitCategory[];
}

export const EMPTY_SLOTS: DiagnosisSlots = {
  dataUsage: null,
  ottUsage: null,
  ottServices: [],
  overseasUsage: null,
  interestCategories: [],
};

/** 핵심 3슬롯(데이터/OTT/해외)이 모두 채워졌는지 여부. interestCategories는 보조 신호라 제외한다. */
export function isCoreSlotsFilled(slots: DiagnosisSlots): boolean {
  return slots.dataUsage !== null && slots.ottUsage !== null && slots.overseasUsage !== null;
}

/** 아직 비어있는 핵심 슬롯 중 가장 먼저 물어볼 것 하나를 고른다. 없으면 null. */
export function firstMissingCoreSlot(slots: DiagnosisSlots): CoreSlotKey | null {
  if (slots.dataUsage === null) return "dataUsage";
  if (slots.ottUsage === null) return "ottUsage";
  if (slots.overseasUsage === null) return "overseasUsage";
  return null;
}

export const SLOT_LABELS: Record<CoreSlotKey, string> = {
  dataUsage: "데이터 사용량",
  ottUsage: "OTT 이용 여부",
  overseasUsage: "해외 이용 가능성",
};

/** 모델이 followUpQuestion을 비워두는 등 예외 상황을 대비한 슬롯별 기본 질문/선택지. */
export const DEFAULT_SLOT_QUESTIONS: Record<CoreSlotKey, { question: string; quickReplies: string[] }> = {
  dataUsage: {
    question: "한 달에 데이터를 어느 정도 쓰시는 편이에요?",
    quickReplies: ["많이 써요", "보통이에요", "거의 안 써요"],
  },
  ottUsage: {
    question: "넷플릭스, 웨이브 같은 OTT 구독 서비스를 이용하고 계신가요?",
    quickReplies: ["이용하고 있어요", "이용 안 해요"],
  },
  overseasUsage: {
    question: "해외에는 얼마나 자주 나가시나요?",
    quickReplies: ["자주 나가요", "가끔 나가요", "거의 안 나가요"],
  },
};
