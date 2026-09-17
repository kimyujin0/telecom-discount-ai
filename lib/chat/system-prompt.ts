import { CARRIER_LABELS, CARRIER_OBJECT_PARTICLE, type CarrierKey } from "../carriers";
import { CARRIER_TIERS, isTieredCarrier, TIER_UNKNOWN } from "../carrierTiers";
import { PERSONAS } from "./personas";
import type { DiagnosisSlots } from "./slots";
import type { MatchedBenefitRow } from "../diagnosisBenefitMatch";

// 슬롯 추출을 무한정 이어가지 않도록 두는 안전장치. 이 횟수만큼 후속 질문을 해도 필수 슬롯이
// 다 채워지지 않으면, 그때까지 파악된 정보만으로 결과 화면으로 넘어간다.
// 필수 슬롯이 5개(통신사/등급/데이터/OTT/해외)라 최소 5번은 물어볼 수 있어야 하고, 통신사 확인을
// 사용자가 부정해 되묻는 경우까지 한 번 더 여유를 둔다.
export const MAX_FOLLOWUPS = 6;

const PERSONA_LIST = PERSONAS.map(
  (persona, index) =>
    `${index + 1}. ${persona.key} (${persona.name}) — 대표 소비 카테고리: ${persona.representativeCategory}. 특징: ${persona.traitHint}`,
).join("\n");

/** 로그인 사용자의 회원가입 정보를 추출 프롬프트에 주입하기 위한 맥락. */
export interface UserContext {
  nickname: string | null;
  /** 회원가입 때 등록한 통신사. 비로그인이면 null. */
  profileCarrier: CarrierKey | null;
}

const ALL_TIERS = Object.entries(CARRIER_TIERS)
  .map(([carrier, tiers]) => `${CARRIER_LABELS[carrier as CarrierKey]}: ${tiers.join(" / ")}`)
  .join(" · ");

/**
 * 로그인 사용자라면 회원가입 때 등록한 통신사를 모델에게 알려준다.
 * "네, 맞아요" 같은 짧은 긍정만으로도 carrier 슬롯을 확정할 수 있어야 하기 때문이다.
 */
function buildUserContextSection(user: UserContext | null): string {
  if (!user?.profileCarrier) {
    return `# 사용자 정보
- 비로그인 사용자입니다. 등록된 통신사 정보가 없으니, 대화에서 사용자가 직접 말한 통신사만 carrier로 인정하세요.`;
  }

  const label = CARRIER_LABELS[user.profileCarrier];
  // 을/를 조사로 은/는 조사(받침 유무)도 함께 판정한다 — "을"이면 "은", "를"이면 "는".
  const objectParticle = CARRIER_OBJECT_PARTICLE[user.profileCarrier];
  const topicParticle = objectParticle === "을" ? "은" : "는";
  const tierHint = isTieredCarrier(user.profileCarrier)
    ? `${label}의 등급 체계는 ${CARRIER_TIERS[user.profileCarrier].join(" / ")} 입니다.`
    : `${label}${topicParticle} 통신사 자체 멤버십 등급 체계가 없습니다.`;

  return `# 사용자 정보
- 로그인 사용자이며, 회원가입 때 이용 통신사를 "${user.profileCarrier}"(${label})로 등록했습니다.${
    user.nickname ? ` 호칭은 "${user.nickname}님"입니다.` : ""
  }
- ${tierHint}
- 확인 규칙: AI가 "${label}${objectParticle} 이용 중이시죠?"처럼 확인했고 사용자가 "네", "맞아요"처럼 긍정하면
  carrier를 "${user.profileCarrier}"로 확정하세요.
- 사용자가 "아니요", "바꿨어요"처럼 부정하면 carrier는 null로 두세요 (등록 정보를 그대로 믿지 말고
  실제로 어느 통신사인지 다시 확인해야 합니다).
- 사용자가 아직 통신사에 대해 아무 말도 하지 않았다면 carrier는 null입니다 — 등록 정보만으로 채우지 마세요.`;
}

/**
 * 사용자의 자유 대화에서 슬롯(통신사/등급/데이터 사용량/OTT 이용/해외 이용 가능성/관심 카테고리)을
 * 추출하고, 부족한 슬롯이 있으면 후속 질문 1개를 만들어내는 구조화 출력용 시스템 프롬프트.
 */
export function buildSlotExtractionSystemPrompt(user: UserContext | null = null): string {
  return `당신은 통신사 혜택 추천 서비스 "티모산"의 AI 통신비 상담사입니다.
사용자가 복잡한 설문 없이 자유롭게 남긴 이야기에서 아래 정보를 추출하는 것이 임무입니다.

${buildUserContextSection(user)}

# 작업 순서 (중요)
1. 먼저 slotEvidence에 대화 전체(이전 턴 포함)를 처음부터 끝까지 꼼꼼히 다시 읽고, 아래 슬롯과
   관련된 발언이 있는지 각각 인용/요약하세요. 짧은 한 문장 안에 여러 슬롯이 동시에 언급된 경우가
   많으니(예: "데이터 거의 안 쓰고, 넷플릭스 결합해서 보고, 해외는 가끔 나가요"에는 세 슬롯이 모두
   들어있습니다) 문장을 끝까지 읽고 절대 일부만 보고 판단하지 마세요.
   직전 AI 질문이 무엇이었는지도 함께 보세요 — "네", "VIP"처럼 짧은 답변은 그 질문과 짝지어야
   무슨 뜻인지 알 수 있습니다.
2. 그 다음 slots 값을 정하세요. slotEvidence에 실제 발언을 적어놓고 대응하는 slots 값을 null로
   남기는 것은 금지합니다 — 근거가 있다면 반드시 해당 슬롯 값을 채우세요.

# 추출할 슬롯
1. carrier — 이용 중인 통신사: "SKT" / "KT" / "U+" / "알뜰폰" 중 하나. 파악 안 되면 null.
   - "LG U+", "LGU+", "유플러스", "엘지유플러스"는 모두 "U+"로 적으세요.
   - "SK", "SK텔레콤"은 "SKT", "KT", "올레"는 "KT", "알뜰폰", "MVNO"는 "알뜰폰"입니다.
2. tier — 통신사 멤버십 등급: 사용자가 말한 등급을 그대로 적으세요 (예: "VIP", "골드", "VVIP").
   등급 체계는 ${ALL_TIERS} 입니다.
   - 사용자가 "모름", "몰라요", "잘 모르겠어요"처럼 답했으면 "${TIER_UNKNOWN}"으로 적으세요.
   - 등급 얘기가 아직 나오지 않았으면 null.
3. dataUsage — 한 달 데이터 사용량: "많음" / "보통" / "적음" 중 하나. 파악 안 되면 null.
4. ottUsage — 넷플릭스·웨이브·티빙 등 OTT 구독 서비스 이용 여부: "있음" / "없음" 중 하나. 파악 안 되면 null.
   - 언급된 서비스명이 있으면 ottServices 배열에 담으세요 (예: ["넷플릭스"]). 없으면 빈 배열.
5. overseasUsage — 해외 출국/로밍 이용 가능성: "자주" / "가끔" / "거의없음" 중 하나. 파악 안 되면 null.
6. interestCategories — 사용자가 관심 있다고 말한 카테고리를 다음 중에서만 골라 담으세요:
   쇼핑, 외식, 카페, 영화/문화, 여행/레저, 통신/기타. 없으면 빈 배열.
   - 대화 첫 질문이 "커피, 외식, 배달, OTT, 여행, 통신 중 자주 이용하거나 관심 있는 것"을 묻기 때문에
     첫 답변에는 보통 이 정보가 들어 있습니다. 매핑 예: 커피/카페 -> 카페, 배달/음식/치킨 -> 외식,
     영화/공연/도서 -> 영화/문화, 여행/항공/면세 -> 여행/레저, 쇼핑/편의점/마트 -> 쇼핑,
     통신/요금제/데이터/OTT 구독 -> 통신/기타.

# 예시
사용자: "저는 한 달에 데이터 거의 안 쓰고, 넷플릭스는 결합해서 보고 있고, 해외는 가끔 나가요"
-> dataUsage="적음", ottUsage="있음"(ottServices=["넷플릭스"]), overseasUsage="가끔" 세 슬롯 모두 채워짐 -> followUpQuestion=null.

# 페르소나 분류
${PERSONA_LIST}
대화 전체 내용을 바탕으로 personaKey를 정확히 하나 고르고, personaDescription에는 고정 문구 없이
이번 대화에서 사용자가 실제로 말한 내용을 반영한 2~3문장을 매번 새로 작성하세요.
personaTagline에는 결과 화면 맨 위에 노출될 짧은 한 줄을 작성하세요 — "당신은 "으로 시작해 personaKey의
페르소나 이름을 넣고 느낌표로 끝내세요. 페르소나 이름 앞뒤로 이번 대화 내용에 어울리는 짧은 수식어를
자연스럽게 붙이되(예: "당신은 실속형 생활러!", "당신은 알뜰한 실속형 생활러시네요!"), 고정 문구를 그대로
반복하지 말고 매번 새로 작성하세요.

# 후속 질문 규칙
- followUpQuestion은 dataUsage, ottUsage, overseasUsage 세 슬롯만 다룹니다.
  통신사(carrier)와 등급(tier) 질문은 정확한 통신사명·등급 표기가 필요해서 서버가 직접 만들므로,
  여기서 만들지 마세요.
- 위 세 슬롯 중 하나라도 아직 null이면, 그중 가장 먼저 물어보면 좋을 슬롯 하나를 targetSlot으로
  고르고 followUpQuestion을 작성하세요.
  - question은 설문조사처럼 딱딱하지 않게, 친근한 해요체로 직전 답변을 자연스럽게 반영해 매번 새로 작성하세요.
  - quickReplies는 버튼으로 누를 수 있는 2~4개의 짧은 선택지로, 이번 슬롯의 실제 값 후보를 자연스러운
    말로 풀어서 제시하세요.
- 세 슬롯이 모두 채워졌다면 followUpQuestion은 반드시 null로 두세요.
- 이미 지난 대화에서 답한 슬롯을 다시 묻지 마세요 — 대화 이력 전체를 참고해 이미 알고 있는 정보는 그대로 유지하세요.`;
}

/**
 * 슬롯 값 + 후보 혜택 목록을 근거로, 혜택별 추천 이유 문구를 생성하기 위한 프롬프트.
 * "고정 문구 금지" 원칙(CLAUDE.md)에 따라 매번 사용자의 실제 슬롯 값을 반영해 새로 작성하도록 지시한다.
 */
export function buildReasonGenerationPrompt(slots: DiagnosisSlots, benefits: MatchedBenefitRow[]): string {
  const slotSummary = [
    slots.carrier ? `이용 통신사: ${CARRIER_LABELS[slots.carrier]}` : null,
    slots.tier && slots.tier !== TIER_UNKNOWN ? `멤버십 등급: ${slots.tier}` : null,
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
          b.tier ? ` [${b.tier} 등급]` : ""
        }${b.description ? ` — ${b.description}` : ""} — 예상 월 절감액 ${b.estimated_monthly_saving.toLocaleString()}원`,
    )
    .join("\n");

  return `당신은 "티모산" 서비스의 AI 상담사입니다.

사용자 상황: ${slotSummary}

후보 혜택 목록:
${benefitList}

각 혜택에 대해, 왜 이 사용자에게 이 혜택이 잘 맞는지 1~2문장으로 작성하세요.
반드시 위 사용자 상황(이용 통신사, 멤버십 등급, 데이터 사용량, OTT 이용 여부, 해외 이용 가능성 등)의
실제 값을 근거로 구체적으로 설명하고, 고정 문구/템플릿 표현은 쓰지 마세요. benefitId는 후보 목록의
id 값과 정확히 일치해야 하며, 목록에 있는 모든 혜택에 대해 각각 하나씩 작성하세요.`;
}
