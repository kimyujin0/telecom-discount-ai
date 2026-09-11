# DB 스키마 설계 (Supabase / PostgreSQL)

[CLAUDE.md](../CLAUDE.md)의 핵심 기능 우선순위(1. 대화형 진단 2. 혜택 매칭+절감액 합산 3. 카카오 나에게 보내기)를 기준으로 설계했습니다.

## ERD 개요

```
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

로그인 없이도 진단 가능해야 하므로 `user_id`는 nullable, 비로그인 사용자는 `anonymous_key`(클라이언트 발급 UUID, 쿠키/localStorage 저장)로 식별한다.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users, nullable) | 로그인 사용자인 경우 |
| `anonymous_key` | text (nullable) | 비로그인 사용자 식별용 |
| `status` | text | `in_progress` / `completed` / `abandoned` |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz (nullable) | |

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

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `provider` | text | SKT / KT / LG U+ 등 |
| `title` | text | |
| `description` | text | |
| `category` | text | media / data / travel / cafe / mobility / etc |
| `discount_type` | text | `percent` / `fixed_amount` / `coupon` / `free_item` |
| `discount_value` | numeric (nullable) | |
| `estimated_monthly_saving` | integer | 원 단위, "티끌모아 태산" 합산에 사용 |
| `valid_from` / `valid_to` | date (nullable) | |
| `source_url` | text (nullable) | |
| `is_active` | boolean | 기본 true |
| `created_at` / `updated_at` | timestamptz | |

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

## 접근 제어 (RLS) 방침

- 모든 테이블 RLS 활성화
- `personas`, `benefits`, `persona_benefits`(카탈로그성 데이터)는 `anon` 역할에 **읽기 전용** 허용
- `diagnosis_sessions` / `diagnosis_messages` / `diagnosis_results` / `diagnosis_result_benefits` / `kakao_send_logs`는 클라이언트가 직접 접근하지 않고, **`app/api/` 라우트 핸들러가 Supabase service role 키로만 접근** (서버에서 세션 소유권 검증 후 처리) — RLS는 anon/authenticated에 대해 기본 차단(deny-all)으로 둔다.

## 마이그레이션 파일

실제 DDL은 [`supabase/migrations/0001_init_schema.sql`](../supabase/migrations/0001_init_schema.sql) 참고.
