# DB 스키마 설계 (Supabase / PostgreSQL)

[CLAUDE.md](../CLAUDE.md)의 핵심 기능 우선순위(1. 대화형 진단 2. 혜택 매칭+절감액 합산 3. 카카오 나에게 보내기)를 기준으로 설계했습니다.

## ERD 개요

```
auth.users (Supabase Auth)
   │ 1:1
   ▼
profiles (가입 시 선택한 이용 통신사, 닉네임/이름)
   │
   └─N:M──► benefits  (saved_benefits: 마이페이지 "저장한 혜택")

personas (6종 고정)
   │ 1:N
   ▼
persona_benefits ◄──── N:1 ──── benefits (혜택 카탈로그)
   ▲
   │ (분류 결과)
diagnosis_results ──1:N──► diagnosis_result_benefits (매칭 스냅샷)
   ▲ 1:1
   │
diagnosis_sessions ──1:N──► diagnosis_messages (턴 기반 채팅 로그)
   │
   └─1:N──► kakao_send_logs (혜택 발송 로그)
```

## 테이블 설계

### 1. `personas` — 페르소나 마스터 (6종 고정)

정적 참조 테이블. **사용자에게 노출되는 설명 문구는 여기 저장하지 않는다** — CLAUDE.md 원칙상 설명은 매 진단마다 LLM이 새로 생성하므로, 이 테이블은 LLM 프롬프트에 넣을 "성향 힌트"만 보관한다.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | smallint (PK) | 1~6 |
| `key` | text (unique) | `media_lover`, `practical_living`, `travel_nomad`, `caffeine_charger`, `mobility`, `balance` |
| `name` | text | 미디어러버, 실속형 생활러 등 표시명 |
| `trait_hint` | text | LLM 프롬프트용 성향 요약 (설명 문구 템플릿 아님) |
| `sort_order` | smallint | 노출 순서 |

### 2. `diagnosis_sessions` — 진단 세션 (채팅 세션 단위)

로그인 없이도 진단 가능해야 하므로 `user_id`는 nullable, 비로그인 사용자는 `anonymous_key`로 식별한다. `anonymous_key`는 **브라우저당 하나의 UUID**로, 서버가 httpOnly 쿠키(`tms_anon_key`, 30일)로 발급해 그 브라우저의 모든 비로그인 세션에 같은 값을 기록한다(`lib/diagnosis/anonymousKey.ts`).

비로그인으로 진단한 뒤 로그인/회원가입하면 그 세션을 계정에 **연결(claim)**한다(`lib/diagnosis/claimSession.ts`): `user_id`를 채우고 `anonymous_key`는 비운다. "쿠키의 키 == 세션의 `anonymous_key`"이고 아직 `user_id`가 비어 있을 때만 되므로, 결과 URL(`/diagnosis/chat?session=<id>`)이 공유돼도 sessionId만 아는 사람은 그 진단을 보거나 가져갈 수 없다. 연결된 진단은 마이페이지 이력에 남는다.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users, nullable) | 로그인 사용자인 경우 |
| `anonymous_key` | text (nullable) | 비로그인 세션의 소유 증명용 브라우저 키(쿠키 값). 로그인 계정에 연결(claim)되면 비운다 |
| `status` | text | `in_progress` / `completed` / `abandoned` |
| `carrier` | text (nullable) | 대화에서 확인한 이용 통신사. 로그인 사용자는 `profiles.carrier`를 확인만 받고 채운다 (0003) |
| `tier` | text (nullable) | 대화에서 확인한 멤버십 등급. `lib/carrierTiers.ts`의 값 또는 `'모름'`(TIER_UNKNOWN) (0007) |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz (nullable) | |

`carrier` + `tier`는 UC-02 혜택 매칭에서 `benefits.carrier` / `benefits.tier` 조건 필터링에 쓴다 (`lib/diagnosisBenefitMatch.ts`). 통신사마다 등급 체계가 달라(SKT 3단계 / KT 6단계 / U+ 7단계) `tier`에는 DB 체크 제약을 두지 않고 `lib/carrierTiers.ts`를 애플리케이션 SSOT로 삼는다.

### 3. `diagnosis_messages` — 턴 기반 채팅 로그

메인페이지 = 채팅 UI라는 UX 원칙에 따라, 일반 챗봇처럼 턴 단위로 저장한다. 스트리밍 응답은 완료된 시점의 최종 텍스트만 저장.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `session_id` | uuid (FK → diagnosis_sessions, cascade delete) | |
| `turn_index` | int | 세션 내 순번 (0부터) |
| `role` | text | `user` / `assistant` / `system` |
| `content` | text | |
| `created_at` | timestamptz | |

`unique(session_id, turn_index)` 제약으로 순서 보장.

### 4. `diagnosis_results` — 진단 결과 (페르소나 분류 + LLM 생성 설명)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `session_id` | uuid (FK → diagnosis_sessions, unique) | 세션당 1개 결과 |
| `persona_id` | smallint (FK → personas) | 분류된 페르소나 |
| `persona_description` | text | **LLM이 사용자 답변 맞춤으로 생성한 설명** (고정 템플릿 아님) |
| `confidence` | numeric(4,3) (nullable) | 분류 확신도 (0~1), 있으면 저장 |
| `model` | text | 사용된 모델 (예: `claude-sonnet-5`) |
| `raw_model_output` | jsonb (nullable) | 디버깅/감사용 원본 응답 |
| `created_at` | timestamptz | |

### 5. `benefits` — 통신사 혜택 카탈로그

두 가지 서로 다른 축의 분류가 공존한다: `persona_category`(진단 매칭용, personas.key 값)와
`category`(`/carriers` 페이지 열람용, 쇼핑/외식 등). 자세한 배경은
[`0004_add_benefits_tier_category.sql`](../supabase/migrations/0004_add_benefits_tier_category.sql) 참고.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `provider` | text | SKT / KT / LG U+ 등 (노출용 표기) |
| `carrier` | text | `SKT` / `KT` / `U+` / `알뜰폰` — 필터용 정규화 값 ([`lib/carriers.ts`](../lib/carriers.ts) SSOT) |
| `tier` | text (nullable) | 통신사별 등급 문자열. 통신사마다 체계가 달라 DB 체크 제약 없이 [`lib/carrierTiers.ts`](../lib/carrierTiers.ts)를 SSOT로 삼는다. 여러 등급 공통 적용은 `"GOLD·SILVER"`처럼 구분자로 나열, 전 등급 적용은 `"전체"` |
| `category` | text (nullable) | `/carriers` 페이지 카테고리 필터 전용. `쇼핑`/`외식`/`카페`/`영화/문화`/`여행/레저`/`통신/기타` 중 하나 ([`lib/carrierBenefitCategories.ts`](../lib/carrierBenefitCategories.ts) SSOT) |
| `usage_condition` | text (nullable) | 이용 횟수/시간대 조건 텍스트 (예: `"월 1회"`, `"1일 1회"`) |
| `persona_category` | text (nullable) | 진단 결과 매칭(UC-02) 전용. `personas.key`와 동일한 값을 담아 시드 시점에 `persona_benefits`를 채운다 |
| `title` | text | |
| `description` | text | |
| `discount_type` | text | `percent` / `fixed_amount` / `coupon` / `free_item` |
| `discount_value` | numeric (nullable) | |
| `estimated_monthly_saving` | integer | 원 단위, "티끌모아 태산" 합산에 사용 |
| `valid_from` / `valid_to` | date (nullable) | |
| `source_url` | text (nullable) | |
| `is_active` | boolean | 기본 true |
| `created_at` / `updated_at` | timestamptz | |

#### KT 등급별 혜택 구조 (`source_url = 'carrier-page-seed'`)

KT는 "전 등급 공통 상시혜택" + "VIP·VVIP 전용 초이스 혜택" 구조로 운영된다. `benefits.tier`에 그 범위를 명시해 저장한다:

| 범위 | `tier` 값 | 행 수 |
| --- | --- | --- |
| 전 등급 공통 | `VVIP,VIP,GOLD,SILVER,WHITE,일반` | 13 (오굿모닝, 달달초이스 9종, QED 골프아카데미, 어바웃펫, 공차) |
| VIP 이상 | `VIP,VVIP` | 5 (VIP초이스 3종, 플레이타임 키즈카페, 백야드 골프) |
| VVIP 전용 | `VVIP` | 3 (VVIP초이스-밀리의서재, 플레이타임 월 1회 완전무료, 롯데시네마 생일 무료영화 3매) |

등급별로 보이는 혜택 수는 VVIP 21 > VIP 18 > GOLD/SILVER/WHITE/일반 13이다. GOLD·SILVER·WHITE·일반에만 해당하는 혜택은 없어서 이 네 등급은 전 등급 공통 혜택과 같다. "택1" 묶음(달달초이스/VIP초이스/VVIP초이스)은 항목을 각각 별도 행으로 두고 `usage_condition`에 "택1"을 적는다. 이 데이터는 `scripts/rebuild-kt-benefits.mjs`(멱등, `--dry-run` 지원)로 만든다 — 기존 행은 지우지 않고 같은 id로 제자리 수정한다(`saved_benefits`/`diagnosis_result_benefits`가 id를 참조). 대응이 없는 옛 행(CGV·메가박스)은 `is_active=false`로 내렸다. `estimated_monthly_saving`에는 금액을 알 수 없어 넣은 추정값이 있으며 스크립트 주석에 표시돼 있다. 화면에서는 6개 등급을 다 나열한 값을 `formatTierLabel()`이 "전체 등급"으로 줄여 보여준다.

#### SKT · LG U+ 등급별 혜택 구조 (`source_url = 'carrier-page-seed'`)

KT와 같은 "전 등급 공통" + "상위 등급 전용" 구조다. `scripts/rebuild-skt-lgu-benefits.mjs`(멱등, `--dry-run`/`--summary` 지원, 행 삭제 없음 — 기존 행은 같은 id로 제자리 수정, 대응이 없는 행은 `is_active=false`)로 적용한다.

- **SKT** (`VIP,GOLD,SILVER`): 전 등급 공통 10종(할인율만 등급별로 다른 항목은 VIP 행 + `GOLD,SILVER` 행으로 분리 — 메가MGC커피·도미노피자·배민 처갓집·CU/세븐일레븐) + VIP 전용 4종(파리바게뜨·백미당·쉐이크쉑 해피아워, 티스테이션 VIP PICK). 등급별 혜택 수: VIP 14 > GOLD 10 = SILVER 10.
- **LG U+** (`carrier='U+'`, provider `LG U+`, 등급 7단계): 전 등급 공통 3종 + VIP 이상 "나만의콕" 13종(tier `VVIP+,VVIP,VIP+,VIP`, 라이프콕 7종은 매월 택1) + 상위 전용 카페 혜택(스타벅스 VIP 더블사이즈업 → VVIP 아메리카노 톨 무료, 엔젤리너스 GOLD 50% / SILVER 30% → VVIP 무료). 등급별 혜택 수: VVIP+·VVIP 18 > VIP+·VIP 17 > GOLD 4 = SILVER 4 > 일반 3 (가치는 GOLD > SILVER > 일반).
- 예상 월 절감액 중 스크립트에 "추정"으로 표시한 값은 임시값이다.

### 6. `persona_benefits` — 페르소나 ↔ 혜택 매핑 (N:M)

혜택 매칭 로직의 기준 테이블. `weight`가 높을수록 해당 페르소나에게 우선 추천.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `persona_id` | smallint (FK → personas) | |
| `benefit_id` | uuid (FK → benefits) | |
| `weight` | int | 매칭 우선순위 (기본 0) |

PK: `(persona_id, benefit_id)`

### 7. `diagnosis_result_benefits` — 진단 결과별 매칭 스냅샷

혜택 카탈로그가 나중에 바뀌어도 **사용자가 실제로 본 추천/절감액 이력은 보존**하기 위해 결과 시점 값을 스냅샷으로 저장.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `diagnosis_result_id` | uuid (FK → diagnosis_results, cascade delete) | |
| `benefit_id` | uuid (FK → benefits) | |
| `rank` | int | 추천 순위 |
| `estimated_monthly_saving` | integer | 스냅샷 시점 절감액 (원) |
| `created_at` | timestamptz | |

**절감액 합산("티끌모아 태산")**은 별도 테이블 없이 `diagnosis_result_benefits`를 `diagnosis_result_id` 기준으로 `SUM(estimated_monthly_saving)`하는 뷰(`diagnosis_result_savings`)로 처리한다.

### 8. `kakao_send_logs` — 카카오 나에게 보내기 발송 로그

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `diagnosis_result_id` | uuid (FK → diagnosis_results) | |
| `status` | text | `success` / `failed` |
| `message_payload` | jsonb | 전송한 메시지 템플릿 내용 |
| `error_message` | text (nullable) | |
| `sent_at` | timestamptz | |

카카오 액세스 토큰은 DB에 영속 저장하지 않는다 — 로그인 직후 서버 메모리/요청 스코프 내에서만 사용하고 즉시 폐기하는 것을 권장(보안). 재사용이 꼭 필요해지면 그때 암호화 컬럼을 추가한다.

### 9. `profiles` — 로그인 사용자 프로필 (auth.users 1:1 확장)

Supabase Auth의 `auth.users`에는 서비스 고유 컬럼을 추가할 수 없어, 회원가입 때 고른 **이용 중인 통신사**를 담는 1:1 확장 테이블을 따로 둔다. `id`를 `auth.users.id`와 동일하게 쓴다.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK, FK → auth.users, cascade delete) | `auth.users.id`와 동일 |
| `email` | text (nullable) | 가입 이메일 사본 (조회 편의용) |
| `carrier` | text (nullable) | 가입 시 선택한 통신사. `lib/carriers.ts`(SSOT)와 동일한 값만 허용 |
| `created_at` / `updated_at` | timestamptz | `updated_at`은 `set_updated_at()` 트리거로 자동 갱신 |

행 생성은 앱 코드가 아니라 **`auth.users` INSERT 트리거**(`handle_new_auth_user()`, security definer)가 담당한다. 회원가입은 `supabase.auth.signUp({ options: { data: { carrier } } })`로 호출하고, 트리거가 `raw_user_meta_data`의 `carrier`를 읽어 행을 만든다 — 앱에서 두 번 쓰는 방식은 두 번째 쓰기가 실패하면 "auth 유저는 있는데 프로필은 없는" 상태가 남는다.

용도: `/mypage`의 가입 정보 표시, 진단 대화에서 "OO님은 SKT를 이용 중이시죠?" 확인 (`app/api/diagnose`).

### 10. `saved_benefits` — 저장한 혜택 (마이페이지 "저장한 혜택")

진단 결과 화면과 `/carriers` 혜택 카드의 별(★) 버튼이 만드는 사용자 ↔ 혜택 N:M 테이블.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `user_id` | uuid (PK, FK → auth.users, cascade delete) | 저장한 사용자 |
| `benefit_id` | uuid (PK, FK → benefits, cascade delete) | 저장한 혜택 |
| `created_at` | timestamptz | 저장 시각 (저장함 정렬용) |

`(user_id, benefit_id)`가 PK라 같은 혜택은 한 번만 저장된다. 마감일은 복사해두지 않고 `benefits.valid_to`를 조인해서 읽는다 — D-day 배지 계산은 `lib/dday.ts`.

## 접근 제어 (RLS) 방침

- 모든 테이블 RLS 활성화
- `personas`, `benefits`, `persona_benefits`(카탈로그성 데이터)는 `anon` 역할에 **읽기 전용** 허용
- `profiles`는 **본인 행만** 읽기/수정 허용(`auth.uid() = id`). INSERT 정책은 두지 않는다 — 행 생성은 위 트리거만 담당한다.
- `saved_benefits`는 **본인 행만** select/insert/delete 허용(`auth.uid() = user_id`), update 정책은 없다. 브라우저(anon 키 + 로그인 세션)가 RLS로 직접 읽고 쓴다.
- `diagnosis_sessions` / `diagnosis_messages` / `diagnosis_results` / `diagnosis_result_benefits` / `kakao_send_logs`는 클라이언트가 직접 접근하지 않고, **`app/api/` 라우트 핸들러가 Supabase service role 키로만 접근** (서버에서 세션 소유권 검증 후 처리) — RLS는 anon/authenticated에 대해 기본 차단(deny-all)으로 둔다.

## 마이그레이션 파일

실제 DDL은 `supabase/migrations/` 참고 — 번호 순서대로 적용한다.

| 파일 | 내용 |
| --- | --- |
| [`0001_init_schema.sql`](../supabase/migrations/0001_init_schema.sql) | 초기 스키마 8개 테이블 + 절감액 합산 뷰 + RLS |
| [`0002_add_benefits_carrier.sql`](../supabase/migrations/0002_add_benefits_carrier.sql) | `benefits.carrier` (통신사 필터용 정규화 값) |
| [`0003_add_diagnosis_sessions_carrier.sql`](../supabase/migrations/0003_add_diagnosis_sessions_carrier.sql) | `diagnosis_sessions.carrier` |
| [`0004_add_benefits_tier_category.sql`](../supabase/migrations/0004_add_benefits_tier_category.sql) | `category` → `persona_category` 개명 + `tier` / `category` / `usage_condition` 추가 |
| [`0005_nullable_benefits_persona_category.sql`](../supabase/migrations/0005_nullable_benefits_persona_category.sql) | `benefits.persona_category` NOT NULL 해제 |
| [`0006_create_profiles.sql`](../supabase/migrations/0006_create_profiles.sql) | `profiles` 테이블 + `auth.users` 트리거 + RLS |
| [`0007_add_diagnosis_sessions_tier.sql`](../supabase/migrations/0007_add_diagnosis_sessions_tier.sql) | `diagnosis_sessions.tier` |
| [`0008_add_profiles_nickname_name.sql`](../supabase/migrations/0008_add_profiles_nickname_name.sql) | `profiles.nickname` / `name` + 가입 트리거 갱신 |
| [`0009_add_diagnosis_result_benefits_reason.sql`](../supabase/migrations/0009_add_diagnosis_result_benefits_reason.sql) | `diagnosis_result_benefits.reason` (진단 시점 추천 이유 스냅샷) |
| [`0010_create_saved_benefits.sql`](../supabase/migrations/0010_create_saved_benefits.sql) | `saved_benefits` 테이블 + 본인 행 전용 RLS |
