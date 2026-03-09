-- Retail Sync 2nd PoC Database Schema

-- 1. 고객 테이블 (customers)
-- 오프라인 매장에 방문한 고객 정보를 통합, 식별하기 위한 용도
CREATE TABLE customers (
  customer_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_last4         VARCHAR(4),
  gender              VARCHAR(1) NOT NULL,
  age_group           VARCHAR(4) NOT NULL,
  membership_status   VARCHAR(10) DEFAULT 'NON_MEMBER',
  membership_joined_at TIMESTAMP,
  first_visit_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  total_visit_count   INTEGER DEFAULT 1,
  total_purchase_count INTEGER DEFAULT 0,
  total_purchase_amount BIGINT DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- 2. 방문 세션 테이블 (visit_sessions)
-- 고객이 특정 매장에 방문하여 이루어진 1번의 전체 응대 세션 기록 용도
CREATE TABLE visit_sessions (
  session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  store_code          VARCHAR(20) NOT NULL,
  staff_id            UUID NOT NULL,
  visit_type          VARCHAR(10) NOT NULL,
  companion_type      VARCHAR(10),
  visit_purpose       VARCHAR(20),
  session_start       TIMESTAMP NOT NULL DEFAULT NOW(),
  session_end         TIMESTAMP,
  duration_seconds    INTEGER,
  day_of_week         SMALLINT,
  hour_of_day         SMALLINT,
  is_treatment        BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 3. 피팅/상품 접촉 테이블 (fitting_records)
-- 방문 세션 중 고객이 실제로 입어보거나 관심을 가진 상품 정보 기록 용도
CREATE TABLE fitting_records (
  fitting_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  product_code        VARCHAR(30),
  product_category    VARCHAR(30),
  fitting_size        VARCHAR(5),
  fitting_color       VARCHAR(20),
  did_try_on          BOOLEAN DEFAULT TRUE,
  purchase_result     VARCHAR(10) NOT NULL,
  purchase_amount     BIGINT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 4. 미구매 사유 테이블 (non_purchase_reasons)
-- 피팅을 경험했지만 최종적으로 구매하지 않은 정확한 사유와 서브태그(정형화 데이터) 기록 용도
CREATE TABLE non_purchase_reasons (
  reason_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fitting_id          UUID NOT NULL REFERENCES fitting_records(fitting_id),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  reason_tag          VARCHAR(20) NOT NULL,
  sub_tag             VARCHAR(30),
  source              VARCHAR(10) DEFAULT 'MANUAL',
  confidence_score    DECIMAL(3,2),
  is_primary          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 5. 고객 취향 프로필 테이블 (customer_preferences)
-- 체형, 선호 컬러 등 고객 고유의 선호도와 특징을 장기 저장하기 위한 용도
CREATE TABLE customer_preferences (
  preference_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  pref_category       VARCHAR(20) NOT NULL,
  pref_value          VARCHAR(30) NOT NULL,
  source              VARCHAR(10) DEFAULT 'MANUAL',
  confidence_score    DECIMAL(3,2),
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 6. 비정형 메모 테이블 (interaction_memos)
-- 판매 사원이 고객과의 대화 맥락이나 구체적 상황을 서술형으로 묘사한 텍스트 데이터 보관 용도
CREATE TABLE interaction_memos (
  memo_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  fitting_id          UUID REFERENCES fitting_records(fitting_id),
  input_type          VARCHAR(10) NOT NULL,
  raw_text            TEXT NOT NULL,
  ner_entities        JSONB,
  sentiment_level     VARCHAR(5),
  intent_tags         VARCHAR(30)[],
  sllm_extracted_tags JSONB,
  sllm_confidence     DECIMAL(3,2),
  staff_confirmed     BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 7. 후속 액션 테이블 (follow_up_actions)
-- 재입고 연락, 사이즈 교환 문의 안내 등 차후에 수행해야 할 고객 관리 액션을 예약하는 용도
CREATE TABLE follow_up_actions (
  action_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  action_type         VARCHAR(20) NOT NULL,
  action_status       VARCHAR(15) DEFAULT 'SCHEDULED',
  scheduled_at        TIMESTAMP,
  executed_at         TIMESTAMP,
  result              VARCHAR(15),
  message_content     TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 8. 고객 만족도 VoC 테이블 (customer_voc)
-- 판매 사원 관찰 기반 결제 시 체감된 고객의 매장 경험 별점과 관련 키워드, 상세 코멘트 보관 용도
CREATE TABLE customer_voc (
  voc_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  staff_id            UUID NOT NULL,
  satisfaction_score  SMALLINT NOT NULL CHECK (satisfaction_score BETWEEN 1 AND 5),
  experience_tags     VARCHAR(20)[],
  customer_comment    TEXT,
  voc_source          VARCHAR(10) DEFAULT 'STAFF_OBS',
  comment_sentiment   VARCHAR(10),
  improvement_tags    VARCHAR(30)[],
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 9. KPI 일별 스냅샷 테이블 (daily_kpi_snapshots)
-- 매장별로 매일 집계된 7대 핵심 성과 지표를 스냅샷 형태로 기록하여 DID(이중차분법) 분석에 활용하는 용도
CREATE TABLE daily_kpi_snapshots (
  snapshot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date       DATE NOT NULL,
  store_code          VARCHAR(20) NOT NULL,
  is_treatment        BOOLEAN NOT NULL,
  total_visitors      INTEGER DEFAULT 0,
  new_visitors        INTEGER DEFAULT 0,
  revisitors          INTEGER DEFAULT 0,
  total_purchases     INTEGER DEFAULT 0,
  repurchases         INTEGER DEFAULT 0,
  total_revenue       BIGINT DEFAULT 0,
  new_memberships     INTEGER DEFAULT 0,
  loyal_customer_avg_spend BIGINT DEFAULT 0,
  non_purchase_data_count INTEGER DEFAULT 0,
  avg_satisfaction    DECIMAL(3,2),
  voc_count           INTEGER DEFAULT 0,
  fitting_count       INTEGER DEFAULT 0,
  fitting_conversion_rate DECIMAL(5,4),
  system_usage_rate   DECIMAL(5,4),
  staff_input_count   INTEGER DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date, store_code)
);
