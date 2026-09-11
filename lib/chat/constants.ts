// 채팅 UI 진입 시 가장 먼저 보여주는 고정 인사말.
// 실제 세션이 생성되는 시점(app/api/diagnose 첫 호출)에 diagnosis_messages의 turn_index=0으로도 저장된다.
export const INITIAL_GREETING =
  "안녕하세요! 몇 가지만 여쭤볼게요. 요즘 어디에 가장 돈을 많이 쓰시나요? 😊";
