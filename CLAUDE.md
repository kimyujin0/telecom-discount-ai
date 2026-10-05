# CLAUDE.md

이 문서는 `telecom-discount-ai` 프로젝트의 기준 문서입니다. 이후 모든 설계/구현 작업은 이 문서를 기준으로 진행합니다.

## 서비스 개요

- **서비스명**: 티모산
- **핵심 컨셉**: 사용자가 메인페이지의 대화형 AI와 채팅하며 소비 성향을 진단받고, 6종 페르소나 중 하나로 분류되어 맞춤 통신사 혜택을 추천받는 서비스

### 페르소나 (6종)

| 키 | 이름 |
| --- | --- |
| `media_lover` | 미디어러버 |
| `practical_living` | 실속형 생활러 |
| `travel_nomad` | 여행형 노마드 |
| `caffeine_charger` | 카페인 충전러 |
| `mobility` | 모빌리티형 |
| `balance` | 밸런스형 |

## 핵심 UX 원칙

- 진단은 **팝업이 아니라 메인페이지 전체가 채팅 UI**로 구성됨
- 동작 방식은 일반 챗봇과 동일 — **턴 기반, 스트리밍 응답**
- 페르소나 설명 문구는 고정 템플릿이 아니라 **매번 LLM이 사용자 답변에 맞춰 새로 생성**해야 함 (하드코딩 금지)

## 핵심 기능 우선순위

1. 메인 대화형 진단 (채팅 UI + 페르소나 분류)
2. 혜택 매칭 + 절감액 합산 ("티끌모아 태산" 문구로 노출)
3. 카카오 "나에게 보내기" 연동

## 혜택 사용 체크 + 누적 절감액

"티끌모아 태산"(핵심 기능 우선순위 2번)을 숫자로 체감하게 하는 기능. 마이페이지 "저장한 혜택" 카드마다
실제로 혜택을 썼는지 체크하고, 그 기록을 모아 이번 달/올해 누적 절감액과 연간 목표 진행률을 보여준다.

- **DB**: `benefit_usages`(사용 기록: user_id, benefit_id, used_at, saved_amount) — `saved_benefits`와
  같은 패턴으로 RLS가 본인 행만 허용, 브라우저가 anon 키로 직접 읽고 쓴다. `profiles.annual_saving_goal`
  (사용자가 직접 입력한 연간 목표, null이면 최근 진단 결과의 예상 연간 절감액을 기본값으로 쓴다).
  `benefits.estimated_monthly_saving`(0001 마이그레이션부터 있던 기존 컬럼)을 "썼어요" 버튼의 기본
  입력값으로 재사용한다 — 이름이 다른 별도 컬럼을 새로 만들지 않았다.
- **이번 주기 판정**: `lib/benefitUsageQuota.ts`가 `lib/dday.ts`/`lib/usageCycle.ts`의 기존 갱신 주기
  판별(일간/월간/월간 창/연간/마감일) 로직을 그대로 재사용해 "이번 주기에 몇 번까지 쓸 수 있는지"와
  "그 범위 안에서 몇 번 썼는지"를 비교한다. 한도를 다 쓰면 카드의 "썼어요" 버튼이 "이번 달 사용 완료" 등으로
  바뀌고 비활성화되며, 실수로 눌렀을 때를 위해 항상 "취소"로 되돌릴 수 있다.
- **시간대**: 날짜 비교는 전부 한국 시간(Asia/Seoul) 기준 — Vercel 서버가 UTC라서 그대로 비교하면 날짜가
  하루 어긋난다. `lib/dday.ts`의 `todayInSeoul()`을 모든 날짜 계산(이번 달/올해 집계 포함)에 재사용한다.
- **UI**: `components/mypage/SavingsSummaryCard.tsx`(이번 달/올해 누적 + 연간 목표 진행 막대 + 응원 문구),
  `components/mypage/UseBenefitButton.tsx`(카드별 "썼어요"), `components/mypage/AnnualGoalForm.tsx`(목표
  직접 입력). 모두 마이페이지(`app/mypage/page.tsx`)에서만 쓰인다.

## 지금 쓸 수 있는 혜택

혜택을 찾아보는 귀찮음을 없애는 게 목적 — 사용자가 아무것도 고르지 않아도 "지금 이 순간" 조건을 만족하는
혜택만 걸러 바로 보여준다. 마이페이지 상단(로그인)과 메인페이지 "오늘 받을 수 있는 할인" 섹션(비로그인)
양쪽에 있다.

- **판별 함수**: `lib/usageCycle.ts`의 `getAvailabilityNow(usageCondition, now)` — 같은 파일의 기존 갱신
  주기 파서(`parseUsageCycle`)를 재사용해 시간대("아침 5~9시", "20~24시", 자정 넘는 범위도 처리)·요일
  ("매주 화요일" 재사용 + "평일 한정"/"주말" 별도 패턴)·날짜 범위("매월 15일~말일" 재사용) 3가지를
  원문 텍스트에서 독립적으로 찾아 전부 동시에 만족해야 "지금 사용 가능"으로 본다. 조건이 없거나 셋 중
  어떤 것으로도 못 읽은 문구(예: "7만원 이상 구매 시")는 항상 사용 가능으로 두고 원문을 그대로
  `rawCondition`에 담아 넘긴다. `now`를 인자로 받으므로 시간을 바꿔가며 테스트할 수 있고,
  `lib/usageCycle.test.mts`(`npm run test:usage-cycle`)에 실제 `usage_condition` 문구 기준 회귀
  테스트가 있다.
- **통신사·등급 결정**: `lib/viewerCarrierTier.ts`의 `resolveViewerCarrierTier(userId)` — 최근 진단
  결과(diagnosis_sessions.carrier/tier)를 1순위, 없으면 `profiles.carrier`를 2순위로 쓴다(둘 다 없으면
  carrier=null → 진단 유도 문구). 비로그인 사용자는 이 정보가 없어서 메인페이지에서 통신사·등급을
  직접 고르게 하고, 고른 값은 이 브라우저에 `localStorage`로 기억해둔다.
- **선별 로직**: `lib/nowAvailableBenefits.ts`의 `selectNowAvailable()`이 Supabase에 의존하지 않는
  순수 함수라서, 서버(로그인, `lib/loadNowAvailableBenefits.ts`)와 브라우저(비로그인, benefits 테이블을
  anon 키로 직접 쿼리)양쪽에서 똑같이 쓴다. "지금 사용 가능"한 것 중 `lib/benefitUsageQuota.ts`로
  이번 주기에 이미 다 쓴 혜택(= "썼어요" 기록 누적액)을 뺀 뒤, 오늘 새로 열린 혜택 → 곧 닫히는 혜택
  → 예상 절감액 큰 순으로 정렬한다.
- **UI**: `components/mypage/NowAvailableSection.tsx`(로그인, "썼어요" 버튼 포함)와
  `components/landing/NowAvailableGuestPreview.tsx`(비로그인, 통신사·등급 선택 UI + 로그인 유도
  문구). "오늘 열림"은 노란 배지로, 남은 시간은 "9시까지 사용 가능" 식으로 보여준다.

## 기술 스택

- **프레임워크**: Next.js (App Router, TypeScript, Tailwind CSS)
- **배포**: Vercel
- **AI**: Vercel AI SDK + Claude API
- **DB**: Supabase

## 폴더 구조 원칙

- `app/` : 라우트 기준 구조 (App Router)
- `components/` : 재사용 UI 컴포넌트
- `app/api/` : API 로직 — 라우트 핸들러 단위로 구성 (하위에 도메인별 디렉터리)
