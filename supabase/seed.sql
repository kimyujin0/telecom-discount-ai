-- telecom-discount-ai — demo seed data for `benefits` (+ persona_benefits 매핑)
-- 실제 통신사 공식 혜택이 아닌, 데모/개발용으로 만든 가상의 예시 데이터입니다.
--
-- 컬럼 매핑 (요청하신 필드명 -> 실제 스키마 컬럼):
--   title          -> benefits.title
--   condition_text -> benefits.description   (이용 조건/자격 설명)
--   discount_amount-> benefits.discount_value(정률 %) / benefits.estimated_monthly_saving(원 단위 월 절감액)
--   expire_date    -> benefits.valid_to
--
-- persona_category 컬럼은 6종 페르소나 key와 동일한 값을 사용해 페르소나별로 바로 매칭되게
-- 구성했습니다 (0004_add_benefits_tier_category.sql에서 category -> persona_category로 개명).
-- carrier 컬럼(0002_add_benefits_carrier.sql)은 /carriers 페이지의 필터 탭(KT/SKT/U+/알뜰폰)과
-- 1:1로 매칭되는 정규화된 값입니다 (provider 'LG U+' -> carrier 'U+'). 데모 데이터에는 알뜰폰 제휴
-- 혜택이 없어 carrier 값은 SKT/KT/U+ 세 가지만 사용합니다.
-- `supabase db reset` 등으로 재실행해도 안전하도록 관련 테이블을 먼저 초기화합니다.

truncate table diagnosis_result_benefits, persona_benefits, benefits restart identity cascade;

insert into benefits
  (provider, carrier, title, description, persona_category, discount_type, discount_value, estimated_monthly_saving, valid_from, valid_to, source_url, is_active)
values
  -- ===== 미디어러버 (media_lover) =====
  ('SKT',    'SKT', '웨이브 프리미엄 6개월 반값 구독',      'SKT 5G 요금제 가입 고객 대상, 웨이브 앱에서 쿠폰 등록 후 적용',        'media_lover',      'percent',      50,   4900, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('KT',     'KT',  '지니뮤직+시즌 결합 요금 할인',         'KT 결합상품 가입 시 매월 자동 할인 적용',                              'media_lover',      'fixed_amount', 6000, 6000, '2026-01-01', '2026-11-30', 'demo-seed', true),
  ('LG U+',  'U+',  '넷플릭스 요금제 결합 할인',            'U+모바일 요금제와 넷플릭스 결합 시 20% 할인',                          'media_lover',      'percent',      20,   3000, '2026-01-01', '2027-03-31', 'demo-seed', true),
  ('SKT',    'SKT', '티빙 광고형 요금 무료 이용권 3개월',   'T우주 멤버십 가입 고객 한정 무료 이용권 제공',                         'media_lover',      'free_item',    null, 5500, '2026-01-01', '2026-10-31', 'demo-seed', true),
  ('KT',     'KT',  '유튜브 프리미엄 제휴 캐시백',          'KT 멤버십 앱에서 매월 캐시백 쿠폰 다운로드 후 사용',                   'media_lover',      'coupon',       null, 4000, '2026-01-01', '2027-01-31', 'demo-seed', true),

  -- ===== 실속형 생활러 (practical_living) =====
  ('LG U+',  'U+',  '온가족 결합 요금 20% 할인',            '가족 3회선 이상 결합 시 전 회선 요금 할인 적용',                       'practical_living', 'percent',      20,   15000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('SKT',    'SKT', '저요금제 캐시백 이벤트',               '5만원 이하 요금제 신규 가입 고객 대상 캐시백 지급',                    'practical_living', 'fixed_amount', 5000, 5000,  '2026-01-01', '2026-11-15', 'demo-seed', true),
  ('KT',     'KT',  '제휴 마트 장보기 할인쿠폰',            'KT 멤버십 VIP 이상 등급 대상 월 1회 마트 할인쿠폰 제공',               'practical_living', 'coupon',       null, 3000,  '2026-01-01', '2027-02-28', 'demo-seed', true),
  ('LG U+',  'U+',  '공과금 자동이체 캐시백',               '요금 자동이체 등록 고객 대상 매월 캐시백 적립',                        'practical_living', 'fixed_amount', 2000, 2000,  '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('SKT',    'SKT', '실속 요금제 데이터 2배 제공',          '3만원대 요금제 가입 시 기본 데이터 2배 제공',                          'practical_living', 'free_item',    null, 4500,  '2026-01-01', '2027-01-31', 'demo-seed', true),

  -- ===== 여행형 노마드 (travel_nomad) =====
  ('KT',     'KT',  '해외 로밍 데이터 요금 50% 할인',       '로밍 온 서비스 사전 신청 고객 대상 데이터 요금 할인',                  'travel_nomad',     'percent',      50,   8000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('SKT',    'SKT', '공항 라운지 무료 이용권',              'T멤버십 VIP 등급 대상 연 2회 공항 라운지 무료 이용',                   'travel_nomad',     'free_item',    null, 3000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('LG U+',  'U+',  '면세점 제휴 할인 쿠폰',                'U+투어 앱 다운로드 후 구매액의 10% 즉시 할인 적용',                    'travel_nomad',     'coupon',       null, 5000, '2026-01-01', '2027-03-31', 'demo-seed', true),
  ('KT',     'KT',  '항공권 예약 캐시백',                   'KT 멤버십 제휴 항공사 예약 시 결제액 5% 캐시백',                       'travel_nomad',     'percent',      5,    6000, '2026-01-01', '2026-10-31', 'demo-seed', true),
  ('SKT',    'SKT', '여행자 단기 데이터 요금제 할인',       '해외 여행자용 단기 데이터 요금제 신규 가입 시 30% 할인',               'travel_nomad',     'fixed_amount', 7000, 7000, '2026-01-01', '2027-02-28', 'demo-seed', true),

  -- ===== 카페인 충전러 (caffeine_charger) =====
  ('SKT',    'SKT', '스타벅스 T멤버십 할인',                'T멤버십 앱 바코드 제시 시 아메리카노 등 음료 20% 할인',                'caffeine_charger', 'percent',      20,   3000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('KT',     'KT',  '편의점 결제 캐시백',                   'KT 멤버십 제휴 편의점(GS25/CU) 결제 시 매월 캐시백 적립',              'caffeine_charger', 'fixed_amount', 2500, 2500, '2026-01-01', '2027-01-31', 'demo-seed', true),
  ('LG U+',  'U+',  '카페 프랜차이즈 제휴 쿠폰팩',          'U+ 멤버십 회원 대상 매월 카페 할인쿠폰 3장 제공',                      'caffeine_charger', 'coupon',       null, 4000, '2026-01-01', '2026-11-30', 'demo-seed', true),
  ('SKT',    'SKT', '편의점 1+1 쿠폰',                      'T멤버십 회원 대상 주 1회 편의점 음료 1+1 쿠폰 제공',                   'caffeine_charger', 'free_item',    null, 3500, '2026-01-01', '2027-03-31', 'demo-seed', true),
  ('KT',     'KT',  '베이커리 카페 할인 멤버십',            'KT 제휴 베이커리 카페 이용 시 15% 상시 할인',                          'caffeine_charger', 'percent',      15,   2800, '2026-01-01', '2026-12-15', 'demo-seed', true),

  -- ===== 모빌리티형 (mobility) =====
  ('LG U+',  'U+',  '공유자전거 요금 할인',                 'U+ 멤버십 회원 대상 공유 자전거 이용 요금 30% 할인',                   'mobility',         'percent',      30,   3000, '2026-01-01', '2027-01-31', 'demo-seed', true),
  ('SKT',    'SKT', '택시 호출 서비스 할인 쿠폰',           'T멤버십 회원 대상 매월 택시 호출 할인쿠폰 제공',                       'mobility',         'coupon',       null, 5000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('KT',     'KT',  '제휴 주유소 리터당 할인',               'KT 멤버십 제휴 주유소 이용 시 리터당 요금 할인',                       'mobility',         'fixed_amount', 6000, 6000, '2026-01-01', '2027-02-28', 'demo-seed', true),
  ('LG U+',  'U+',  '대중교통 요금 캐시백',                 'U+ 결합 요금제 가입 고객 대상 대중교통 이용 캐시백 적립',              'mobility',         'fixed_amount', 4000, 4000, '2026-01-01', '2026-11-30', 'demo-seed', true),
  ('SKT',    'SKT', '전기차 충전 요금 할인',                'T맵 EV 제휴 충전소 이용 시 충전 요금 20% 할인',                        'mobility',         'percent',      20,   5500, '2026-01-01', '2027-03-31', 'demo-seed', true),

  -- ===== 밸런스형 (balance) =====
  ('KT',     'KT',  '전 가맹점 통합 포인트 2배 적립',       'KT 멤버십 전 제휴처 이용 시 포인트 2배 적립',                          'balance',          'percent',      100,  3000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('LG U+',  'U+',  '요금제 전체 5% 상시 할인',             'U+ 다이렉트 요금제 가입 시 요금 5% 자동 할인 적용',                    'balance',          'percent',      5,    4500, '2026-01-01', '2027-06-30', 'demo-seed', true),
  ('SKT',    'SKT', 'T멤버십 만능 캐시백',                  '다양한 제휴처에서 사용 가능한 월 캐시백 자동 지급',                    'balance',          'fixed_amount', 5000, 5000, '2026-01-01', '2026-12-31', 'demo-seed', true),
  ('KT',     'KT',  '생활 전반 할인 쿠폰팩',                '쇼핑/영화/편의점 등 다양한 카테고리 할인쿠폰 매월 제공',               'balance',          'coupon',       null, 4000, '2026-01-01', '2027-01-31', 'demo-seed', true),
  ('LG U+',  'U+',  '구독 서비스 자유 이용권',              '매월 원하는 제휴 구독 서비스 1개를 무료로 체험 가능',                  'balance',          'free_item',    null, 5000, '2026-01-01', '2026-10-31', 'demo-seed', true);

-- 페르소나 ↔ 혜택 매핑: persona_category 값이 personas.key와 동일하므로 조인으로 자동 매핑
insert into persona_benefits (persona_id, benefit_id, weight)
select p.id, b.id, 100
from benefits b
join personas p on p.key = b.persona_category
where b.source_url = 'demo-seed';

-- ============================================================
-- /carriers 페이지용 실제 통신사별 등급 혜택 (통신사 → 등급 → 카테고리 계단식 필터 시연용)
-- 위 demo-seed 데이터와 달리 persona_category는 없다(진단 매칭 대상이 아님, 순수 카탈로그 열람용).
-- 한 브랜드가 등급별로 할인율이 다르면(예: 메가MGC커피 VIP 20% / GOLD·SILVER 10%) 등급마다 별도
-- 행으로 나눈다 — tier 컬럼은 한 행에 하나의 "등급 그룹"만 담기 때문. tier 판정 규칙은
-- lib/carrierTiers.ts의 tierMatches() 참고 ("전체" = 전 등급, "GOLD·SILVER"처럼 구분자로 묶어서
-- 여러 등급 공통 적용을 표현).
insert into benefits
  (provider, carrier, tier, category, title, description, usage_condition, discount_type, discount_value, estimated_monthly_saving, source_url, is_active)
values
  -- ===== SKT =====
  ('SKT', 'SKT', 'VIP',         '카페',     '메가MGC커피',               'VIP 등급 전용 할인',                                   '1일 1회',                         'percent',      20,    4500, 'carrier-page-seed', true),
  ('SKT', 'SKT', 'GOLD·SILVER', '카페',     '메가MGC커피',               'GOLD·SILVER 등급 할인',                               '1일 1회',                         'percent',      10,    2500, 'carrier-page-seed', true),
  ('SKT', 'SKT', 'VIP',         '외식',     '도미노피자',                 'VIP 등급 할인 또는 적립 선택',                        '1일 1회',                         'percent',      30,    9000, 'carrier-page-seed', true),
  ('SKT', 'SKT', 'GOLD·SILVER', '외식',     '도미노피자',                 'GOLD·SILVER 등급 할인 또는 적립 선택',                '1일 1회',                         'percent',      20,    6000, 'carrier-page-seed', true),
  ('SKT', 'SKT', 'VIP',         '외식',     '파리바게뜨 해피아워',         'VIP 등급 전용 해피아워 할인',                         '오후 8시~자정, 1만원 이상 구매 시', 'fixed_amount', 4000,  4000, 'carrier-page-seed', true),
  ('SKT', 'SKT', '전체',        '여행/레저', '에버랜드·캐리비안베이',       '본인 40% 할인 + 동반 3인 30% 할인',                   '전 등급 적용',                     'percent',      40,   15000, 'carrier-page-seed', true),
  ('SKT', 'SKT', '전체',        '쇼핑',     '삼다수 무라벨 생수',          '전 등급 상시 할인',                                   '전 등급 적용',                     'percent',      10,    1000, 'carrier-page-seed', true),
  ('SKT', 'SKT', 'VIP',         '외식',     '배달의민족 처갓집양념치킨',    'VIP 등급 할인',                                       '1일 1회',                         'fixed_amount', 8000,  8000, 'carrier-page-seed', true),
  ('SKT', 'SKT', 'GOLD·SILVER', '외식',     '배달의민족 처갓집양념치킨',    'GOLD·SILVER 등급 할인',                               '1일 1회',                         'fixed_amount', 6000,  6000, 'carrier-page-seed', true),

  -- ===== KT =====
  ('KT', 'KT', 'VIP',  '영화/문화', '밀리의서재',            'VIP초이스 대상, 연 6회 한도로 1개월 무료 이용권 제공',      '연 6회, 1회 1개월 무료',       'free_item', null, 9900,  'carrier-page-seed', true),
  ('KT', 'KT', 'VVIP', '영화/문화', '밀리의서재',            'VVIP초이스 대상, 연 12회 한도로 3개월 무료 이용권 제공',    '연 12회, 1회 3개월 무료',      'free_item', null, 9900,  'carrier-page-seed', true),
  ('KT', 'KT', 'VVIP', '영화/문화', '롯데시네마',            '생일 달 한정 무료 영화 예매권 3매 제공',                    '생일 월 1회, 3매 한정',        'free_item', null, 3000,  'carrier-page-seed', true),
  ('KT', 'KT', '전체', '카페',     '오굿모닝(던킨도너츠·파리바게트·GS25)', '아침 시간대 전 등급 할인',              '아침 5~9시, 1일 1회',          'percent',   30,   4500,  'carrier-page-seed', true),
  ('KT', 'KT', 'VIP',  '쇼핑',     'ABC마트',               'VIP초이스 대상, 일정 금액 이상 구매 시 할인',               '7만원 이상 구매 시',           'fixed_amount', 10000, 10000, 'carrier-page-seed', true),
  ('KT', 'KT', 'VIP',  '여행/레저', '플레이타임 키즈카페',    '평일 2시간권 할인 + 보호자 1인 무료 동반',                  '평일 한정, 보호자 1인 무료',   'percent',   50,   8000,  'carrier-page-seed', true),
  ('KT', 'KT', 'VVIP', '여행/레저', '플레이타임 키즈카페',    '월 1회 무료 이용',                                          '월 1회',                       'free_item', null, 15000, 'carrier-page-seed', true),

  -- ===== U+ (LG U+) =====
  ('LG U+', 'U+', 'VIP',                  '카페',     '스타벅스',            'VIP 등급, 음료 사이즈업 무료',                        '월 1회',              'free_item', null, 1000,  'carrier-page-seed', true),
  ('LG U+', 'U+', 'VVIP',                 '카페',     '스타벅스',            'VVIP 등급, 아메리카노 톨 사이즈 무료',                 '월 1회',              'free_item', null, 4500,  'carrier-page-seed', true),
  ('LG U+', 'U+', 'VVIP·VIP',             '카페',     '공차 VIP콕',          '나만의 콕 선택 시 블랙 밀크티 L 무료',                 '월 1회',              'free_item', null, 5000,  'carrier-page-seed', true),
  ('LG U+', 'U+', 'VVIP+,VVIP,VIP+,VIP',  '영화/문화', '영화콕',              'VIP 이상 등급 대상, 나만의 콕 선택 시 무료 영화 1매',   '월 1회',              'free_item', null, 12000, 'carrier-page-seed', true),
  ('LG U+', 'U+', '전체',                 '쇼핑',     'GS25·파리바게트 기본혜택', '전 등급 기본 멤버십 할인 쿠폰 제공',              '전 등급 적용',        'coupon',    null, 1000,  'carrier-page-seed', true),
  ('LG U+', 'U+', '전체',                 '여행/레저', '현대면세점',           'GOLD 등급 자동 부여 + 구매액 할인',                    '전 등급 적용',        'percent',   15,   6000,  'carrier-page-seed', true);
