import type { BenefitCategory } from "@/lib/carrierBenefitCategories";
import type { CarrierKey } from "@/lib/carriers";
import { CARRIER_LABELS, CARRIER_OBJECT_PARTICLE, CARRIER_OPTIONS } from "@/lib/carriers";
import { isTieredCarrier, TIER_UNKNOWN, tierQuickReplies } from "@/lib/carrierTiers";

// 진단 슬롯 정의 — app/api/diagnose가 대화에서 추출하는 구조화된 정보의 단일 소스(SSOT).
// 서버(구조화 출력 스키마)와 클라이언트(빠른 선택지 기본값) 양쪽에서 공유한다.

export const DATA_USAGE_VALUES = ["많음", "보통", "적음"] as const;
export type DataUsageValue = (typeof DATA_USAGE_VALUES)[number];

export const OTT_USAGE_VALUES = ["있음", "없음"] as const;
export type OttUsageValue = (typeof OTT_USAGE_VALUES)[number];

export const OVERSEAS_USAGE_VALUES = ["자주", "가끔", "거의없음"] as const;
export type OverseasUsageValue = (typeof OVERSEAS_USAGE_VALUES)[number];

// 물어보는 순서대로 나열한다 — firstMissingCoreSlot()이 이 순서를 따른다.
// 관심 카테고리(interestCategories)는 대화 첫 인사말이 이미 물어보고 있고 "없음"도 자연스러운
// 답변이라 필수 슬롯에 넣지 않는다(보조 신호).
export type CoreSlotKey = "carrier" | "tier" | "dataUsage" | "ottUsage" | "overseasUsage";

export interface DiagnosisSlots {
  /** 이용 중인 통신사. 로그인 사용자는 profiles.carrier를 확인만 받고 채운다. */
  carrier: CarrierKey | null;
  /** 통신사 멤버십 등급. CARRIER_TIERS 값 또는 TIER_UNKNOWN("모름"). */
  tier: string | null;
  dataUsage: DataUsageValue | null;
  ottUsage: OttUsageValue | null;
  ottServices: string[];
  overseasUsage: OverseasUsageValue | null;
  interestCategories: BenefitCategory[];
}

export const EMPTY_SLOTS: DiagnosisSlots = {
  carrier: null,
  tier: null,
  dataUsage: null,
  ottUsage: null,
  ottServices: [],
  overseasUsage: null,
  interestCategories: [],
};

/**
 * 아직 비어있는 필수 슬롯 중 가장 먼저 물어볼 것 하나를 고른다. 없으면 null.
 *
 * 등급(tier)은 통신사를 알아야 질문 문구와 선택지를 만들 수 있으므로 carrier 다음에 온다.
 * 알뜰폰은 통신사 자체 멤버십 등급 체계가 없어(lib/carrierTiers.ts 참고) 등급을 묻지 않는다.
 */
export function firstMissingCoreSlot(slots: DiagnosisSlots): CoreSlotKey | null {
  if (slots.carrier === null) return "carrier";
  if (isTieredCarrier(slots.carrier) && slots.tier === null) return "tier";
  if (slots.dataUsage === null) return "dataUsage";
  if (slots.ottUsage === null) return "ottUsage";
  if (slots.overseasUsage === null) return "overseasUsage";
  return null;
}

/** 필수 슬롯이 모두 채워졌는지 여부. */
export function isCoreSlotsFilled(slots: DiagnosisSlots): boolean {
  return firstMissingCoreSlot(slots) === null;
}

export const SLOT_LABELS: Record<CoreSlotKey, string> = {
  carrier: "이용 통신사",
  tier: "멤버십 등급",
  dataUsage: "데이터 사용량",
  ottUsage: "OTT 이용 여부",
  overseasUsage: "해외 이용 가능성",
};

export interface SlotQuestion {
  question: string;
  quickReplies: string[];
}

/** 통신사/등급 질문 문구를 만들 때 필요한 대화 맥락. */
export interface SlotQuestionContext {
  /** 대화에서 이미 확정된 통신사 (등급 질문 문구에 넣는다). */
  carrier: CarrierKey | null;
  /** 로그인 사용자가 회원가입 때 등록한 통신사. 비로그인이면 null. */
  profileCarrier: CarrierKey | null;
  /** "OO님" 호칭 (이메일 로컬파트 기반). */
  nickname: string | null;
  /** 이미 "~를 이용 중이시죠?" 확인 질문을 한 적이 있는지 — 있으면 확인 대신 다시 직접 묻는다. */
  carrierConfirmAsked: boolean;
}

// 대화 이력에서 "이 질문을 이미 했는지"를 찾기 위한 표식.
// 같은 질문을 되묻는 루프를 막는 데 쓴다 (질문 문구는 buildSlotQuestion이 만들므로 항상 이 표식을 포함한다).
/** 로그인 사용자에게 등록된 통신사를 확인하는 질문의 표식. */
export const CARRIER_CONFIRM_MARKER = "이용 중이시죠?";
/** 등급을 묻는 질문의 표식. */
export const TIER_QUESTION_MARKER = "어떤 등급이신가요?";

/**
 * 슬롯별 질문 문구.
 *
 * carrier/tier는 문구와 선택지가 사용자 상태(로그인 여부, 통신사)에 따라 정해져야 하고 등급 표기를
 * 정확히 제시해야 해서 LLM 생성에 맡기지 않고 여기서 확정한다. 나머지 세 슬롯은 LLM이 직전 답변을
 * 반영해 매번 새로 만들고(lib/chat/system-prompt.ts), 이 문구는 그게 비어 있을 때의 안전망이다.
 */
export function buildSlotQuestion(slot: CoreSlotKey, context: SlotQuestionContext): SlotQuestion {
  switch (slot) {
    case "carrier": {
      // 로그인 사용자는 가입 때 등록한 통신사를 "확인만" 하고 넘어간다.
      if (context.profileCarrier && !context.carrierConfirmAsked) {
        const who = context.nickname ? `${context.nickname}님은` : "혹시";
        const particle = CARRIER_OBJECT_PARTICLE[context.profileCarrier];
        return {
          question: `${who} ${CARRIER_LABELS[context.profileCarrier]}${particle} ${CARRIER_CONFIRM_MARKER}`,
          quickReplies: ["네, 맞아요", "아니요, 다른 통신사예요"],
        };
      }
      return {
        question: "어느 통신사를 이용하시나요?",
        quickReplies: CARRIER_OPTIONS.map((carrier) => CARRIER_LABELS[carrier]),
      };
    }
    case "tier": {
      const where = context.carrier ? `${CARRIER_LABELS[context.carrier]}에서` : "통신사 멤버십에서";
      return {
        question: `혹시 ${where} ${TIER_QUESTION_MARKER} (VIP/골드/실버 등, 모르시면 '${TIER_UNKNOWN}'이라고 답해주세요)`,
        quickReplies: tierQuickReplies(context.carrier),
      };
    }
    case "dataUsage":
      return {
        question: "한 달에 데이터를 어느 정도 쓰시는 편이에요?",
        quickReplies: ["많이 써요", "보통이에요", "거의 안 써요"],
      };
    case "ottUsage":
      return {
        question: "넷플릭스, 웨이브 같은 OTT 구독 서비스를 이용하고 계신가요?",
        quickReplies: ["이용하고 있어요", "이용 안 해요"],
      };
    case "overseasUsage":
      return {
        question: "해외에는 얼마나 자주 나가시나요?",
        quickReplies: ["자주 나가요", "가끔 나가요", "거의 안 나가요"],
      };
  }
}

/** carrier/tier 질문은 LLM이 만든 문구로 대체하지 않는다 (정확한 통신사명/등급 표기가 필요하므로). */
export function isFixedQuestionSlot(slot: CoreSlotKey): boolean {
  return slot === "carrier" || slot === "tier";
}
