-- telecom-discount-ai — profiles.nickname / profiles.name 컬럼 추가
--
-- 회원가입 폼(SignupForm)에 "닉네임"(화면 노출용 호칭)과 "이름"(실명, 화면에는 노출하지 않음) 입력을
-- 추가하면서 함께 저장할 컬럼이다. 둘 다 앱에서는 필수 입력이지만, 이 마이그레이션 이전에 가입한
-- 기존 행에는 값이 없으므로 컬럼 자체는 nullable로 둔다 — nickname이 비어 있으면
-- lib/auth/user.ts의 resolveNickname()이 이메일 로컬파트로 대체해 화면이 깨지지 않게 한다.

alter table profiles
  add column if not exists nickname text,
  add column if not exists name text;

comment on column profiles.nickname is
  '회원가입 시 입력한 닉네임. 헤더 계정 메뉴, 마이페이지 "OO님, 반가워요!", 진단 대화 호칭 등 화면에 노출되는 값이다. 가입 폼에서는 필수지만, 이 컬럼 추가 이전 가입자는 NULL일 수 있어 nullable로 둔다.';

comment on column profiles.name is
  '회원가입 시 입력한 실명. 화면에는 노출하지 않고 내부 식별용으로만 보관한다.';

-- ============================================================
-- auth.users 생성 트리거가 nickname / name도 함께 채우도록 갱신
-- ============================================================
-- signUpAction(app/actions/auth.ts)이 supabase.auth.signUp({ options: { data: { nickname, name, carrier } } })로
-- 호출하며, 이 값들이 auth.users.raw_user_meta_data에 담긴다. 0006_create_profiles.sql에서 만든 트리거
-- 함수를 그대로 갱신한다(트리거 자체는 재생성할 필요 없음 — 함수 본문만 바뀐다).
create or replace function handle_new_auth_user() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, email, carrier, nickname, name)
  values (
    new.id,
    new.email,
    -- 체크 제약에 없는 값이 메타데이터로 들어오면 가입 자체가 실패하므로 여기서 걸러 null로 떨군다.
    case
      when new.raw_user_meta_data ->> 'carrier' in ('SKT', 'KT', 'U+', '알뜰폰')
        then new.raw_user_meta_data ->> 'carrier'
      else null
    end,
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
