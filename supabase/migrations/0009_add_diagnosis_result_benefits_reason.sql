-- telecom-discount-ai — diagnosis_result_benefits.reason 컬럼 추가
--
-- app/api/diagnose/route.ts는 매칭된 혜택마다 LLM으로 추천 이유(reason)를 생성해 진단 응답에는
-- 담아 보내지만, 지금까지는 diagnosis_result_benefits에 스냅샷으로 저장하지 않았다. 그래서
-- 마이페이지 진단 상세(/mypage/diagnosis/[id])에서 지난 진단의 추천 이유를 다시 보여줄 방법이 없었다.
--
-- rank/estimated_monthly_saving과 같은 이유로(카탈로그가 바뀌어도 진단 당시 값을 보존) reason도
-- diagnosis_result_benefits에 스냅샷으로 저장한다. 0009 이전에 저장된 행은 값이 없어 nullable로 둔다.

alter table diagnosis_result_benefits
  add column if not exists reason text;

comment on column diagnosis_result_benefits.reason is
  '진단 시점에 LLM이 생성한 이 혜택의 추천 이유 스냅샷. 마이페이지 진단 상세(/mypage/diagnosis/[id])에서 그대로 보여준다. 0009 이전 저장된 행은 NULL.';
