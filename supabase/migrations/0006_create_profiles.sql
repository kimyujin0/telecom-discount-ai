-- telecom-discount-ai — profiles 테이블 (Supabase Auth 이메일+비밀번호 회원가입용)
--
-- Supabase Auth의 auth.users는 직접 컬럼을 추가할 수 없고 애플리케이션 쿼리로 조인하기도 불편하다.
-- 그래서 서비스 고유 프로필 정보(회원가입 때 고른 "이용 중인 통신사")는 public.profiles에 따로 둔다.
-- auth.users.id를 그대로 PK로 쓰는 1:1 확장 테이블이다.
--
-- carrier 값 종류는 benefits.carrier / diagnosis_sessions.carrier와 동일해야 하므로
-- lib/carriers.ts(SSOT)를 따른다. 참고: 0002_add_benefits_carrier.sql, 0003_add_diagnosis_sessions_carrier.sql

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  carrier text check (carrier in ('SKT', 'KT', 'U+', '알뜰폰')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is
  'auth.users 1:1 확장 프로필. 회원가입 시 입력한 이용 통신사(carrier)를 보관하며 /mypage와 진단 대화(app/api/diagnose)의 통신사 자동 확인에 쓰인다.';

comment on column profiles.carrier is
  '회원가입 시 선택한 이용 중인 통신사. lib/carriers.ts(SSOT)와 동일한 값만 허용한다. 미선택 가입을 허용하므로 nullable.';

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- auth.users 생성 시 profiles 행 자동 생성
-- ============================================================
-- 회원가입은 supabase.auth.signUp({ options: { data: { carrier } } })로 호출하며, 이때 넘긴 carrier가
-- auth.users.raw_user_meta_data에 담긴다. 트리거로 profiles를 채우면 "auth 유저는 있는데 프로필 행은
-- 없는" 중간 상태가 생기지 않는다(앱 코드에서 두 번 쓰는 방식은 두 번째 쓰기가 실패하면 깨진다).
create or replace function handle_new_auth_user() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, email, carrier)
  values (
    new.id,
    new.email,
    -- 체크 제약에 없는 값이 메타데이터로 들어오면 가입 자체가 실패하므로 여기서 걸러 null로 떨군다.
    case
      when new.raw_user_meta_data ->> 'carrier' in ('SKT', 'KT', 'U+', '알뜰폰')
        then new.raw_user_meta_data ->> 'carrier'
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================
-- RLS — 본인 행만 읽기/수정 가능
-- ============================================================
-- insert 정책은 두지 않는다: profiles 행 생성은 위 트리거(security definer)만 담당한다.
alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
