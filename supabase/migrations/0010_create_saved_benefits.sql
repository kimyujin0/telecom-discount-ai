-- telecom-discount-ai — saved_benefits 테이블 (마이페이지 "저장한 혜택")
--
-- 진단 결과 화면과 /carriers 혜택 카드의 "혜택 저장하기"(별) 버튼이 여기에 행을 만들고 지운다.
-- (user_id, benefit_id)를 PK로 써서 같은 혜택을 두 번 저장할 수 없게 한다 — 별도 id 컬럼은 두지 않는다.
--
-- diagnosis_*와 달리 이 테이블은 브라우저(anon 키 + 로그인 세션)가 RLS로 직접 읽고 쓴다.
-- 본인 행만 select/insert/delete 가능하고 update는 정책을 두지 않아 막혀 있다(저장 여부만 있는 테이블이라
-- 수정할 컬럼이 없다). 마감일(D-day)은 여기 복사하지 않고 benefits.valid_to를 조인해서 읽는다 —
-- 카탈로그에서 마감일이 바뀌면 저장함 화면에도 그대로 반영된다.

create table if not exists saved_benefits (
  user_id uuid not null references auth.users(id) on delete cascade,
  benefit_id uuid not null references benefits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, benefit_id)
);

create index if not exists idx_saved_benefits_user_created
  on saved_benefits(user_id, created_at desc);

comment on table saved_benefits is
  '사용자가 "혜택 저장하기"로 담아둔 혜택. 마이페이지 "저장한 혜택"에서 benefits.valid_to 기준 D-day 배지와 함께 보여준다.';

alter table saved_benefits enable row level security;

drop policy if exists saved_benefits_select_own on saved_benefits;
create policy saved_benefits_select_own on saved_benefits
  for select using (auth.uid() = user_id);

drop policy if exists saved_benefits_insert_own on saved_benefits;
create policy saved_benefits_insert_own on saved_benefits
  for insert with check (auth.uid() = user_id);

drop policy if exists saved_benefits_delete_own on saved_benefits;
create policy saved_benefits_delete_own on saved_benefits
  for delete using (auth.uid() = user_id);
