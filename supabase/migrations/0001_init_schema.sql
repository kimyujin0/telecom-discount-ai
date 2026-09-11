-- telecom-discount-ai — initial schema
-- See docs/database-schema.md for design rationale.

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. personas — 6종 고정 페르소나 마스터
-- ============================================================
create table personas (
  id smallint primary key,
  key text not null unique,
  name text not null,
  trait_hint text not null, -- LLM 프롬프트용 성향 힌트 (고객 노출 문구 아님)
  sort_order smallint not null default 0
);

insert into personas (id, key, name, trait_hint, sort_order) values
  (1, 'media_lover',       '미디어러버',      'OTT/영상 스트리밍 소비가 많고 콘텐츠 구독에 지출을 아끼지 않음', 1),
  (2, 'practical_living',  '실속형 생활러',    '통신비를 포함한 고정비 절감에 민감하고 실용적인 소비를 선호', 2),
  (3, 'travel_nomad',      '여행형 노마드',    '국내외 이동과 여행 빈도가 높고 로밍/데이터 사용이 잦음', 3),
  (4, 'caffeine_charger',  '카페인 충전러',    '카페/편의점 소비 빈도가 높고 일상 소액 결제가 잦음', 4),
  (5, 'mobility',          '모빌리티형',      '대중교통, 車, 공유 모빌리티 등 이동 관련 지출 비중이 큼', 5),
  (6, 'balance',           '밸런스형',        '특정 카테고리에 편중되지 않고 소비가 고르게 분산됨', 6);

-- ============================================================
-- 2. diagnosis_sessions — 진단(채팅) 세션
-- ============================================================
create table diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_key text, -- 비로그인 사용자 식별 (쿠키/localStorage 발급 UUID)
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint diagnosis_sessions_owner_check
    check (user_id is not null or anonymous_key is not null)
);

create index idx_diagnosis_sessions_user_id on diagnosis_sessions(user_id);
create index idx_diagnosis_sessions_anonymous_key on diagnosis_sessions(anonymous_key);

-- ============================================================
-- 3. diagnosis_messages — 턴 기반 채팅 로그
-- ============================================================
create table diagnosis_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references diagnosis_sessions(id) on delete cascade,
  turn_index int not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create index idx_diagnosis_messages_session_id on diagnosis_messages(session_id);

-- ============================================================
-- 4. diagnosis_results — 진단 결과 (페르소나 분류 + LLM 생성 설명)
-- ============================================================
create table diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references diagnosis_sessions(id) on delete cascade,
  persona_id smallint not null references personas(id),
  persona_description text not null, -- 매 진단마다 LLM이 새로 생성 (고정 템플릿 금지)
  confidence numeric(4,3) check (confidence >= 0 and confidence <= 1),
  model text not null,
  raw_model_output jsonb,
  created_at timestamptz not null default now()
);

create index idx_diagnosis_results_persona_id on diagnosis_results(persona_id);

-- ============================================================
-- 5. benefits — 통신사 혜택 카탈로그
-- ============================================================
create table benefits (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  title text not null,
  description text,
  category text not null,
  discount_type text not null
    check (discount_type in ('percent', 'fixed_amount', 'coupon', 'free_item')),
  discount_value numeric,
  estimated_monthly_saving integer not null default 0, -- 원 단위
  valid_from date,
  valid_to date,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_benefits_category on benefits(category);
create index idx_benefits_is_active on benefits(is_active);

-- ============================================================
-- 6. persona_benefits — 페르소나 ↔ 혜택 매핑 (N:M)
-- ============================================================
create table persona_benefits (
  persona_id smallint not null references personas(id) on delete cascade,
  benefit_id uuid not null references benefits(id) on delete cascade,
  weight int not null default 0,
  primary key (persona_id, benefit_id)
);

-- ============================================================
-- 7. diagnosis_result_benefits — 진단 결과별 매칭 스냅샷
-- ============================================================
create table diagnosis_result_benefits (
  id uuid primary key default gen_random_uuid(),
  diagnosis_result_id uuid not null references diagnosis_results(id) on delete cascade,
  benefit_id uuid not null references benefits(id),
  rank int not null,
  estimated_monthly_saving integer not null, -- 스냅샷 시점 값 (카탈로그 변경과 무관하게 보존)
  created_at timestamptz not null default now(),
  unique (diagnosis_result_id, rank)
);

create index idx_diagnosis_result_benefits_result_id on diagnosis_result_benefits(diagnosis_result_id);

-- 절감액 합산 뷰 ("티끌모아 태산")
create view diagnosis_result_savings as
select
  diagnosis_result_id,
  sum(estimated_monthly_saving) as total_monthly_saving,
  sum(estimated_monthly_saving) * 12 as total_yearly_saving,
  count(*) as matched_benefit_count
from diagnosis_result_benefits
group by diagnosis_result_id;

-- ============================================================
-- 8. kakao_send_logs — 카카오 나에게 보내기 발송 로그
-- ============================================================
create table kakao_send_logs (
  id uuid primary key default gen_random_uuid(),
  diagnosis_result_id uuid not null references diagnosis_results(id) on delete cascade,
  status text not null check (status in ('success', 'failed')),
  message_payload jsonb not null,
  error_message text,
  sent_at timestamptz not null default now()
);

create index idx_kakao_send_logs_result_id on kakao_send_logs(diagnosis_result_id);

-- ============================================================
-- updated_at 자동 갱신 트리거 (benefits)
-- ============================================================
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_benefits_updated_at
  before update on benefits
  for each row execute function set_updated_at();

-- ============================================================
-- RLS — 카탈로그성 테이블만 공개 읽기 허용, 나머지는 service role 전용
-- ============================================================
alter table personas enable row level security;
alter table benefits enable row level security;
alter table persona_benefits enable row level security;
alter table diagnosis_sessions enable row level security;
alter table diagnosis_messages enable row level security;
alter table diagnosis_results enable row level security;
alter table diagnosis_result_benefits enable row level security;
alter table kakao_send_logs enable row level security;

create policy personas_public_read on personas for select using (true);
create policy benefits_public_read on benefits for select using (is_active = true);
create policy persona_benefits_public_read on persona_benefits for select using (true);

-- diagnosis_*, kakao_send_logs 는 별도 정책을 추가하지 않는다.
-- => anon/authenticated 역할은 기본적으로 접근 불가(deny-all)이며,
--    app/api/ 라우트 핸들러가 Supabase service role 키로만 읽고 쓴다.
