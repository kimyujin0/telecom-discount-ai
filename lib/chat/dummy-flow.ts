// 더미 진단 플로우 — 실제 LLM(Claude API) 연동 전까지 사용하는 목업 데이터.
// TODO: Vercel AI SDK + Claude API 연동 시 app/api/diagnosis 라우트 핸들러로 대체.

export const INITIAL_GREETING =
  "안녕하세요! 몇 가지만 여쭤볼게요. 요즘 어디에 가장 돈을 많이 쓰시나요? 😊";

export const FOLLOW_UP_QUESTIONS = [
  "그렇군요! 한 달에 그쪽으로 대략 얼마 정도 쓰시는 편이에요?",
  "요즘 여행이나 장거리 이동은 얼마나 자주 하세요?",
  "카페나 편의점은 하루에 몇 번 정도 들르시는 편이에요?",
  "구독 중인 OTT나 스트리밍 서비스가 있다면 알려주세요!",
  "마지막 질문이에요 — 데이터는 넉넉하게 쓰는 편인가요, 와이파이 위주로 쓰시는 편인가요?",
];

export const CLOSING_MESSAGE =
  "답변 감사해요! 지금까지 말씀해주신 내용을 바탕으로 딱 맞는 소비 페르소나를 진단했어요 🎉 아래에서 확인해보세요.";

// 초기 인사(1) + 후속 질문(N) 이후 마지막 답변까지 = 총 사용자 턴 수
export const TOTAL_USER_TURNS = FOLLOW_UP_QUESTIONS.length + 1;
