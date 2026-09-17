-- telecom-discount-ai — benefits.persona_category NOT NULL 제약 해제
--
-- persona_category는 UC-02(페르소나 기반 추천) 매칭용 컬럼으로, 시드 시점에 personas.key 값을
-- 담아 persona_benefits 매핑을 만드는 데만 쓰인다(0004 주석 참고). 반면 /carriers 페이지용 행은
-- 특정 페르소나에 묶이지 않는 통신사 카탈로그 데이터라 persona_category 값이 존재하지 않는다.
-- 지금까지는 이 컬럼이 NOT NULL이라 /carriers 전용 행을 넣을 때 저장이 거부되었다(23502 에러).
--
-- UC-02 매칭 로직(app/api/diagnose/route.ts)은 benefits.persona_category 컬럼을 직접 필터링하지
-- 않고 persona_benefits 매핑 테이블만 조회하므로, 이 컬럼을 nullable로 바꿔도 기존 추천 로직에는
-- 영향이 없다. persona_category가 없는 행은 애초에 persona_benefits에도 매핑되지 않으니(seed.sql의
-- insert into persona_benefits ... join personas p on p.key = b.persona_category 참고) 자연히
-- UC-02 추천 대상에서 제외된다.

alter table benefits alter column persona_category drop not null;

comment on column benefits.persona_category is
  '진단 결과 매칭용(UC-02, nullable). personas.key 값과 동일해야 하며, 시드 시점에 persona_benefits
  매핑을 만드는 데 쓴다. /carriers 페이지의 category와는 다른 축. NULL이면 특정 페르소나에 묶이지
  않는 통신사 카탈로그 전용 행(예: /carriers 페이지 데이터)이라는 뜻이며 UC-02 추천 대상에서 제외된다.';
