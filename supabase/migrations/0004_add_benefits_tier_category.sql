-- telecom-discount-ai — /carriers 페이지 계단식 필터(통신사 → 등급 → 카테고리)를 위한 컬럼 추가
--
-- 기존 benefits.category 컬럼은 personas.key 값(media_lover 등)을 그대로 담아 시드 시점에
-- persona_benefits 매핑을 만드는 용도로 써왔다. 이번에 새로 추가하는 "카테고리"(쇼핑/외식/카페 등)는
-- 완전히 다른 축의 분류라서 같은 이름을 재사용하면 두 의미가 충돌한다. 그래서:
--   - 기존 컬럼: category -> persona_category 로 이름 변경 (진단 결과 매칭 전용, 계속 personas.key 값을 담음)
--   - 신규 컬럼: category (쇼핑/외식/카페/영화·문화/여행·레저/통신·기타) — /carriers 페이지 전용

alter table benefits rename column category to persona_category;
alter index if exists idx_benefits_category rename to idx_benefits_persona_category;

comment on column benefits.persona_category is
  '진단 결과 매칭용(UC-02). personas.key 값과 동일해야 하며, 시드 시점에 persona_benefits 매핑을 만드는 데 쓴다. /carriers 페이지의 category와는 다른 축.';

alter table benefits
  add column if not exists tier text,
  add column if not exists category text
    check (category in ('쇼핑', '외식', '카페', '영화/문화', '여행/레저', '통신/기타')),
  add column if not exists usage_condition text;

comment on column benefits.tier is
  '통신사별 등급 문자열(SKT: VIP/GOLD/SILVER, KT: VVIP/VIP/GOLD/SILVER/WHITE/일반, U+: VVIP+/VVIP/VIP+/VIP/GOLD/SILVER/일반).
  통신사마다 등급 체계가 달라 DB 체크 제약을 두지 않고 lib/carrierTiers.ts를 애플리케이션 SSOT로 삼는다.
  여러 등급에 공통 적용되면 "GOLD·SILVER"처럼 구분자(,·/)로 나열하고, 전 등급 적용이면 "전체"로 저장한다.
  판정 로직은 lib/carrierTiers.ts의 tierMatches() 참고.';

comment on column benefits.category is
  '/carriers 페이지 계단식 필터 전용 카테고리. lib/carrierBenefitCategories.ts(SSOT)와 반드시 동일해야 한다.';

comment on column benefits.usage_condition is
  '이용 횟수/시간대 등 조건 텍스트 (예: "월 1회", "1일 1회", "오후 8시~자정, 1만원 이상 구매 시").';

create index if not exists idx_benefits_tier on benefits(tier);
create index if not exists idx_benefits_category on benefits(category);
