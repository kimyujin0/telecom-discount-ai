-- telecom-discount-ai — diagnosis_sessions.carrier 컬럼 추가
-- 진단 대화 맨 처음에 묻는 "어느 통신사를 이용하시나요?" 답변을 세션 단위로 저장한다.
-- UC-02 혜택 매칭 단계(app/api/diagnose)에서 이 값과 정확히 일치하는 benefits.carrier만 추천하도록
-- 필터링하는 데 사용한다. 값 종류는 benefits.carrier와 동일해야 하므로 lib/carriers.ts(SSOT)를 따른다.

alter table diagnosis_sessions
  add column if not exists carrier text
    check (carrier in ('SKT', 'KT', 'U+', '알뜰폰'));

-- NOT NULL로 강제하지 않는다: 이 마이그레이션 이전에 생성된 세션이 이미 존재할 수 있고,
-- 신규 세션에 대한 필수 입력 검증은 app/api/diagnose 라우트 핸들러에서 담당한다.

create index if not exists idx_diagnosis_sessions_carrier on diagnosis_sessions(carrier);
