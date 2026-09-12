-- telecom-discount-ai — benefits.carrier 컬럼 추가
-- /carriers 페이지의 통신사 필터 탭(KT / SKT / U+ / 알뜰폰)과 1:1로 매칭되는 정규화된 값.
-- provider 컬럼은 기존처럼 노출용 표기(예: "LG U+")를 그대로 유지하고,
-- carrier는 필터링 전용으로 분리해 값 표기가 달라도(LG U+ -> U+) 안전하게 매칭한다.

alter table benefits
  add column if not exists carrier text
    check (carrier in ('SKT', 'KT', 'U+', '알뜰폰'));

-- 이미 데이터가 있는 환경을 위한 백필 (provider 기준). supabase db reset처럼 이 마이그레이션이
-- seed.sql보다 먼저 실행되는 흐름에서는 이 시점에 benefits가 비어 있어 영향이 없다.
update benefits set carrier = case
  when provider = 'SKT' then 'SKT'
  when provider = 'KT' then 'KT'
  when provider = 'LG U+' then 'U+'
  else carrier
end
where carrier is null;

alter table benefits alter column carrier set not null;

create index if not exists idx_benefits_carrier on benefits(carrier);
