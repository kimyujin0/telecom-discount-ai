-- telecom-discount-ai — benefit_usages 테이블 (마이페이지 "썼어요" 버튼 사용 기록)
--
-- 마이페이지 "저장한 혜택" 카드의 "썼어요" 버튼이 여기에 행을 쓰고, 잘못 눌렀을 때는 그 행을
-- 지워 취소한다. 절감액 요약 카드("이번 달 OO원 아낌", "올해 누적 OO원")는 이 테이블의
-- saved_amount 합계로 계산한다 — benefits.estimated_monthly_saving은 카탈로그의 "예상"값이고,
-- 이 테이블은 사용자가 실제로 "썼다"고 확인한 기록이라 서로 다르다.
--
-- saved_benefits(0010_create_saved_benefits.sql)와 같은 이유로 브라우저(anon 키 + 로그인 세션)가
-- RLS로 직접 읽고 쓴다. "이번 주기에 이미 다 썼는지" 판정은 lib/benefitUsageQuota.ts가 혜택마다
-- usage_condition을 해석해서 하므로, 이 테이블 자체에는 주기 정보를 두지 않는다.

create table if not exists benefit_usages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  benefit_id uuid not null references benefits(id) on delete cascade,
  used_at timestamptz not null default now(),
  saved_amount integer not null check (saved_amount >= 0), -- 이번 사용으로 아낀 금액(원)
  created_at timestamptz not null default now()
);

create index if not exists idx_benefit_usages_user_used_at
  on benefit_usages(user_id, used_at desc);

create index if not exists idx_benefit_usages_user_benefit
  on benefit_usages(user_id, benefit_id, used_at desc);

comment on table benefit_usages is
  '"썼어요" 버튼으로 남긴 혜택 사용 기록. 마이페이지 절감액 요약(이번 달/올해 누적)과 저장한 혜택
   카드의 "이번 주기 사용 완료" 표시(lib/benefitUsageQuota.ts)가 이 테이블을 센다.';

comment on column benefit_usages.saved_amount is
  '이번 사용으로 아낀 금액(원). "썼어요" 버튼을 누를 때 benefits.estimated_monthly_saving을
   기본값으로 보여주고 사용자가 직접 고칠 수 있게 한다 — 실제로 아낀 금액은 혜택·회차마다 다를 수 있다.';

alter table benefit_usages enable row level security;

drop policy if exists benefit_usages_select_own on benefit_usages;
create policy benefit_usages_select_own on benefit_usages
  for select using (auth.uid() = user_id);

drop policy if exists benefit_usages_insert_own on benefit_usages;
create policy benefit_usages_insert_own on benefit_usages
  for insert with check (auth.uid() = user_id);

drop policy if exists benefit_usages_delete_own on benefit_usages;
create policy benefit_usages_delete_own on benefit_usages
  for delete using (auth.uid() = user_id);
