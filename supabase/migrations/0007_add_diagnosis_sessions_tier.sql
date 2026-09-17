-- telecom-discount-ai — diagnosis_sessions.tier 컬럼 추가
-- 진단 대화에서 새로 묻는 "어떤 등급이신가요?"(통신사 멤버십 등급) 답변을 세션 단위로 저장한다.
-- carrier(0003)와 짝을 이뤄 UC-02 혜택 매칭에서 benefits.carrier + benefits.tier 조건 필터링에 쓰인다.
--
-- 통신사마다 등급 체계가 전혀 다르므로(SKT 3단계 / KT 6단계 / U+ 7단계) benefits.tier와 마찬가지로
-- DB 체크 제약을 두지 않고 lib/carrierTiers.ts를 애플리케이션 SSOT로 삼는다.
-- 사용자가 자기 등급을 모르는 경우가 흔해서 '모름'(lib/carrierTiers.ts의 TIER_UNKNOWN)도 유효한 값이며,
-- 이때는 등급 조건을 걸지 않고 등급 무관 혜택까지 모두 추천한다.

alter table diagnosis_sessions
  add column if not exists tier text;

comment on column diagnosis_sessions.tier is
  '진단 대화에서 확인한 통신사 멤버십 등급. lib/carrierTiers.ts의 CARRIER_TIERS 값 또는 ''모름''(TIER_UNKNOWN). 미확인이면 NULL.';
