import { z } from "zod";
import { BENEFIT_CATEGORIES, type BenefitCategory } from "@/lib/carrierBenefitCategories";
import { CARRIERS, type CarrierKey } from "@/lib/carriers";
import { DATA_USAGE_VALUES, OTT_USAGE_VALUES, OVERSEAS_USAGE_VALUES } from "./slots";
import type { DataUsageValue, OttUsageValue, OverseasUsageValue } from "./slots";
import { PERSONAS, type PersonaKey } from "./personas";

const personaKeyTuple = PERSONAS.map((p) => p.key) as [PersonaKey, ...PersonaKey[]];
const categoryTuple = BENEFIT_CATEGORIES as unknown as [BenefitCategory, ...BenefitCategory[]];
const carrierTuple = CARRIERS as unknown as [CarrierKey, ...CarrierKey[]];
const dataUsageTuple = DATA_USAGE_VALUES as unknown as [DataUsageValue, ...DataUsageValue[]];
const ottUsageTuple = OTT_USAGE_VALUES as unknown as [OttUsageValue, ...OttUsageValue[]];
const overseasUsageTuple = OVERSEAS_USAGE_VALUES as unknown as [OverseasUsageValue, ...OverseasUsageValue[]];

// 매 턴, 대화 전체에서 슬롯을 다시 추출한다 (누적 병합 대신 매번 전체 재추출 — 상태 병합 버그를 피하기 위함).
//
// 필드 순서가 곧 모델의 사고 순서다: slotEvidence(근거 인용) -> slots(그 근거로 판정) ->
// followUpQuestion -> personaKey/personaDescription(내부 분류, 가장 나중) 순으로 두어, 슬롯을
// 놓치지 않고 근거를 먼저 명시적으로 되짚어보게 한다(evidence-first 패턴). personaKey를 먼저 채우게
// 하면 슬롯 추출에 쓸 "사고 여력"을 분류에 먼저 소모해버려 슬롯을 놓치는 경우가 관찰되어 순서를 바꿨다.
export const diagnosisExtractionSchema = z.object({
  slotEvidence: z
    .object({
      carrier: z
        .string()
        .min(1)
        .describe(
          "이용 통신사 관련 발언 인용/요약. AI가 '(통신사)를 이용 중이시죠?'라고 물었고 사용자가 긍정했다면 그 사실을 적으세요. 언급이 없으면 '언급 없음'.",
        ),
      tier: z
        .string()
        .min(1)
        .describe("통신사 멤버십 등급 관련 발언 인용/요약. 등급을 모른다고 답한 것도 여기 적으세요. 언급이 없으면 '언급 없음'."),
      dataUsage: z.string().min(1).describe("데이터 사용량 관련 발언을 그대로 인용하거나 요약. 언급이 없으면 '언급 없음'."),
      ottUsage: z.string().min(1).describe("OTT 구독 서비스 이용 관련 발언 인용/요약. 언급이 없으면 '언급 없음'."),
      overseasUsage: z.string().min(1).describe("해외 출국/로밍 이용 관련 발언 인용/요약. 언급이 없으면 '언급 없음'."),
    })
    .describe("아래 slots 값을 정하기 전에, 대화 전체에서 각 슬롯과 관련된 부분을 먼저 찾아 적으세요."),
  slots: z.object({
    carrier: z
      .enum(carrierTuple)
      .nullable()
      .describe(
        "이용 중인 통신사. 'LG U+'/'LGU+'/'유플러스'는 모두 'U+'로 적으세요. slotEvidence.carrier가 '언급 없음'일 때만 null.",
      ),
    tier: z
      .string()
      .nullable()
      .describe(
        "통신사 멤버십 등급을 사용자가 말한 대로 (예: 'VIP', '골드', 'VVIP', '실버'). 등급을 모른다고 답했으면 '모름'. 등급 얘기가 아직 없으면 null.",
      ),
    dataUsage: z.enum(dataUsageTuple).nullable().describe("한 달 데이터 사용량. slotEvidence.dataUsage가 '언급 없음'일 때만 null."),
    ottUsage: z.enum(ottUsageTuple).nullable().describe("OTT 구독 서비스 이용 여부. slotEvidence.ottUsage가 '언급 없음'일 때만 null."),
    ottServices: z.array(z.string()).describe("언급된 OTT 서비스명 (예: 넷플릭스). 없으면 빈 배열."),
    overseasUsage: z.enum(overseasUsageTuple).nullable().describe("해외 출국/로밍 이용 가능성. slotEvidence.overseasUsage가 '언급 없음'일 때만 null."),
    interestCategories: z
      .array(z.enum(categoryTuple))
      .describe("사용자가 직접 언급한 관심 카테고리만. 없으면 빈 배열."),
  }),
  followUpQuestion: z
    .object({
      targetSlot: z.enum(["dataUsage", "ottUsage", "overseasUsage"]),
      question: z.string().min(1),
      quickReplies: z.array(z.string().min(1)).min(2).max(4),
    })
    .nullable()
    .describe(
      "dataUsage/ottUsage/overseasUsage 중 비어있는 슬롯이 있으면 그중 하나를 겨냥한 질문 1개. 세 슬롯이 모두 채워졌으면 반드시 null. (통신사/등급 질문은 서버가 직접 만들므로 여기서 다루지 마세요.)",
    ),
  personaKey: z.enum(personaKeyTuple).describe("6가지 페르소나 중 가장 가까운 하나 (내부 분류용)"),
  personaDescription: z
    .string()
    .min(1)
    .describe("이번 대화 내용을 구체적으로 반영한 2~3문장 설명. 고정 문구 금지, 매번 새로 작성."),
  personaTagline: z
    .string()
    .min(1)
    .describe(
      "결과 화면에 노출되는 짧은 한 줄. '당신은 '으로 시작해 personaKey의 페르소나 이름을 넣고 느낌표로 끝내세요 " +
        "(예: '당신은 실속형 생활러!', '당신은 알뜰한 실속형 생활러시네요!'). 페르소나 이름 앞뒤 수식어는 이번 대화 내용에 " +
        "맞춰 매번 다르게, 고정 문구 없이 새로 작성하세요.",
    ),
});

export type DiagnosisExtraction = z.infer<typeof diagnosisExtractionSchema>;

export const reasonGenerationSchema = z.object({
  reasons: z
    .array(
      z.object({
        benefitId: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .describe("후보 혜택 목록의 모든 id에 대해 각각 하나씩."),
});

export type ReasonGenerationResult = z.infer<typeof reasonGenerationSchema>;
