// /diagnosis 페이지 UI 문구 — 순수 클라이언트 표시용 상수. 백엔드로는 전송되지 않는다.

// 대화의 첫 AI 인사말. 예시 카테고리를 문구 안에 모두 나열해, 사용자가 무엇을 말해야 할지
// 고민하지 않고 바로 답할 수 있게 한다 (선택 버튼이 아니라 자유 텍스트 입력을 그대로 유지한다).
// 여기 나열한 카테고리는 lib/chat/system-prompt.ts의 interestCategories 매핑 안내와 짝을 이룬다.
export const OPENING_MESSAGE =
  "커피, 외식, 배달, OTT, 여행, 통신 등 혜택 중에서 자주 이용하거나 관심 있는 걸 알려주세요!";

// 자유 대화 입력창의 예시 placeholder — 인사말이 물어본 것에 대한 답변 예시를 보여준다.
export const FREE_TEXT_PLACEHOLDER = "저는 배달이랑 OTT를 자주 쓰고, 카페도 거의 매일 가요";

// "AI 분석 중" 로딩 애니메이션에서 순차적으로 체크되는 항목들.
export const ANALYZING_STEPS = ["관심 혜택 카테고리 정리 중", "이용 통신사·등급 확인 중", "맞춤 혜택 찾는 중"];
