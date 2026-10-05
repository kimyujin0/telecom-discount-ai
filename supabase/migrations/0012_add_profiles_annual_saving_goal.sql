-- telecom-discount-ai — profiles.annual_saving_goal 컬럼 추가
--
-- 마이페이지 절감액 요약 카드의 "연간 목표 진행 막대"에 쓰는 사용자 지정 목표액(원)이다.
-- null이면 화면(app/mypage/page.tsx)이 최근 진단 결과의 예상 연간 절감액
-- (diagnosis_result_savings.total_yearly_saving)을 기본 목표로 보여준다 — 이 컬럼에는 그 추정값을
-- 복사해 저장하지 않으므로, 사용자가 직접 입력하지 않는 한 진단을 다시 할 때마다 최신 추정값을
-- 자동으로 따라간다.

alter table profiles
  add column if not exists annual_saving_goal integer check (annual_saving_goal is null or annual_saving_goal >= 0);

comment on column profiles.annual_saving_goal is
  '마이페이지 절감액 요약의 연간 목표(원). 사용자가 직접 입력한 값만 저장한다. null이면 화면에서
   최근 진단 결과의 예상 연간 절감액을 기본 목표로 보여준다.';
