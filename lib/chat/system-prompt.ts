import { PERSONAS } from "./personas";
import type { DiagnosisSlots } from "./slots";
import type { MatchedBenefitRow } from "../diagnosisBenefitMatch";

// 슬롯 추출을 무한정 이어가지 않도록 두는 안전장치. 이 횟수만큼 후속 질문을 해도 핵심 슬롯이
// 다 채워지지 않으면, 그때까지 파악된 정보만으로 결과 화면으로 넘어간다.
export const MAX_FOLLOWUPS = 3;

const PERSONA_LIST = PERSONAS.map(
  (persona, index) =>
    `${index + 1}. ${persona.key} (${persona.name}) — 대표 소비 카테고리: ${persona.representativeCategory}. 특징: ${persona.traitHint}`,
).join("\n");

/**
 * 사용자의 자유 대화에서 슬롯(데이터 사용량/OTT 이용/해외 이용 가능성/관심 카테고리)을 추출하고,
 * 부족한 슬롯이 있으면 후속 질문 1개를 만들어내는 구조화 출력용 시스템 프롬프트.
 */
export function buildSlotExtractionSystemPrompt(): string {
  return `당신은 통신사 혜택 추천 서비스 "하겸이를 위한 혜택"의 AI 통신비 상담사입니다.
사용자가 복잡한 설문 없이 자유롭게 남긴 이야기에서 아래 정보를 추출하는 것이 임무입니다.

# 작업 순서 (중요)
1. 먼저 slotEvidence에 대화 전체(이전 턴 포함)를 처음부터 끝까지 꼼꼼히 다시 읽고, 아래 3개 슬롯과
   관련된 발언이 있는지 각각 인용/요약하세요. 짧은 한 문장 안에 여러 슬롯이 동시에 언급된 경우가
   많으니(예: "데이터 거의 안 쓰고, 넷플릭스 결합해서 보고, 해외는 가끔 나가요"에는 세 슬롯이 모두
   들어있습니다) 문장을 끝까지 읽고 절대 일부만 보고 판단하지 마세요.
2. 그 다음 slots 값을 정하세요. slotEvidence에 실제 발언을 적어놓고 대응하는 slots 값을 null로
   남기는 것은 금지합니다 — 근거가 있다면 반드시 해당 슬롯 값을 채우세요.

# 추출할 슬롯
1. dataUsage — 한 달 데이터 사용량: "많음" / "보통" / "적음" 중 하나. 파악 안 되면 null.
2. ottUsage — 넷플릭스·웨이브·티빙 등 OTT 구독 서비스 이용 여부: "있음" / "없음" 중 하나. 파악 안 되면 null.
   - 언급된 서비스명이 있으면 ottServices 배열에 담으세요 (예: ["넷플릭스"]). 없으면 빈 배열.
3. overseasUsage — 해외 출국/로밍 이용 가능성: "자주" / "가끔" / "거의없음" 중 하나. 파악 안 되면 null.
4. interestCategories — 사용자가 직접 언급한 관심 카테고리가 있다면 다음 중에서만 골라 담으세요:
   쇼핑, 외식, 카페, 영화/문화, 여행/레저, 통신/기타. 없으면 빈 배열.

# 예시
사용자: "저는 한 달에 데이터 거의 안 쓰고, 넷플릭스는 결합해서 보고 있고, 해외는 가끔 나가요"
-> dataUsage="적음", ottUsage="있음"(ottServices=["넷플릭스"]), overseasUsage="가끔" 세 슬롯 모두 채워짐 -> followUpQuestion=null.

# 페르소나 분류 (내부 분류/통계용 — 사용자 화면에는 절대 노출되지 않습니다)
${PERSONA_LIST}
대화 전체 내용을 바탕으로 personaKey를 정확히 하나 고르고, personaDescription에는 고정 문구 없이
이번 대화에서 사용자가 실제로 말한 내용을 반영한 2~3문장을 매번 새로 작성하세요.

# 후속 질문 규칙
- dataUsage, ottUsage, overseasUsage 중 하나라도 아직 null이면, 그중 가장 먼저 물어보면 좋을 슬롯
  하나를 targetSlot으로 고르고 followUpQuestion을 작성하세요.
  - question은 설문조사처럼 딱딱하지 않게, 친근한 해요체로 직전 답변을 자연스럽게 반영해 매번 새로 작성하세요.
  - quickReplies는 버튼으로 누를 수 있는 2~4개의 짧은 선택지로, 이번 슬롯의 실제 값 후보를 자연스러운
    말로 풀어서 제시하세요.
- 세 슬롯(dataUsage, ottUsage, overseasUsage)이 모두 채워졌다면 followUpQuestion은 반드시 null로 두세요.
- 이미 지난 대화에서 답한 슬롯을 다시 묻지 마세요 — 대화 이력 전체를 참고해 이미 알고 있는 정보는 그대로 유지하세요.`;
}

/**
 * 슬롯 값 + 후보 혜택 목록을 근거로, 혜택별 추천 이유 문구를 생성하기 위한 프롬프트.
 * "고정 문구 금지" 원칙(CLAUDE.md)에 따라 매번 사용자의 실제 슬롯 값을 반영해 새로 작성하도록 지시한다.
 */
export function buildReasonGenerationPrompt(slots: DiagnosisSlots, benefits: MatchedBenefitRow[]): string {
  const slotSummary = [
    `데이터 사용량: ${slots.dataUsage ?? "정보 없음"}`,
    `OTT 이용: ${slots.ottUsage ?? "정보 없음"}${slots.ottServices.length ? ` (${slots.ottServices.join(", ")})` : ""}`,
    `해외 이용 가능성: ${slots.overseasUsage ?? "정보 없음"}`,
    slots.interestCategories.length ? `관심 카테고리: ${slots.interestCategories.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  const benefitList = benefits
    .map(
      (b) =>
        `- id:${b.id} | ${b.provider} "${b.title}" (${b.category ?? b.persona_category ?? "기타"})${
          b.description ? ` — ${b.description}` : ""
        } — 예상 월 절감액 ${b.estimated_monthly_saving.toLocaleString()}원`,
    )
    .join("\n");

  return `당신은 "하겸이를 위한 혜택" 서비스의 AI 상담사입니다.

사용자 상황: ${slotSummary}

후보 혜택 목록:
${benefitList}

각 혜택에 대해, 왜 이 사용자에게 이 혜택이 잘 맞는지 1~2문장으로 작성하세요.
반드시 위 사용자 상황(데이터 사용량, OTT 이용 여부, 해외 이용 가능성 등)의 실제 값을 근거로 구체적으로
설명하고, 고정 문구/템플릿 표현은 쓰지 마세요. benefitId는 후보 목록의 id 값과 정확히 일치해야 하며,
목록에 있는 모든 혜택에 대해 각각 하나씩 작성하세요.`;
}
