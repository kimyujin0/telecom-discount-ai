// 타입폼 스타일 진단 화면 진입 시, 첫 질문 전에 딱 한 번 보여주는 AI 자기소개 멘트.
// 백엔드로는 전송되지 않는 순수 UI 문구이며, system-prompt.ts에도 동일한 정체성("티끌이")을
// 반영해 이후 질문/답변 톤이 일관되게 유지되도록 한다.
export const AI_INTRO_MESSAGE =
  "안녕하세요, 저는 티끌이예요! 몇 가지 질문으로 당신에게 맞는 통신사 혜택 유형을 찾아드릴게요.";

// 자기소개 다음에 보여주는 첫 질문. 실제 세션이 생성되는 시점(app/api/diagnose 첫 호출)에
// diagnosis_messages의 turn_index=0으로 저장되어 LLM 대화 이력의 시작점이 된다.
export const INITIAL_GREETING = "요즘 어디에 가장 돈을 많이 쓰시나요? 😊";
