-- Retail Sync 2nd PoC Database Schema
-- All 9 tables as specified in the PRD

-- 1. 고객 테이블
CREATE TABLE customers (
  customer_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_last4         VARCHAR(4),
  gender              VARCHAR(1) NOT NULL,
  age_group           VARCHAR(4) NOT NULL,
  membership_status   VARCHAR(10) DEFAULT 'NON_MEMBER',
  membership_joined_at TIMESTAMP,
  is_loyal            BOOLEAN DEFAULT FALSE,
  first_visit_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  total_visit_count   INTEGER DEFAULT 1,
  total_purchase_count INTEGER DEFAULT 0,
  total_purchase_amount BIGINT DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- 2. 방문 세션 테이블
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

-- 3. 피팅/상품 접촉 테이블
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

-- 4. 미구매 사유 테이블
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

-- 5. 고객 취향 프로필 테이블
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

-- 6. 비정형 메모 테이블
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

-- 7. 후속 액션 테이블
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

-- 8. 고객 만족도 VoC 테이블
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

-- 9. KPI 일별 스냅샷 테이블
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

-- 10. 기준 지표 테이블 (PoC 이전 평균 데이터 - KPI 비교용)
CREATE TABLE baseline_metrics (
  store_code          VARCHAR(20) NOT NULL,
  metric_name         VARCHAR(30) NOT NULL,
  baseline_value      BIGINT NOT NULL,
  baseline_period     VARCHAR(20),
  created_at          TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (store_code, metric_name)
);

-- Staff table for authentication
CREATE TABLE staff (
  staff_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name          VARCHAR(50) NOT NULL,
  email               VARCHAR(100) UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  store_code          VARCHAR(20) NOT NULL,
  role                VARCHAR(20) DEFAULT 'SELLER',
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
  store_code          VARCHAR(20) PRIMARY KEY,
  store_name          VARCHAR(100) NOT NULL,
  brand               VARCHAR(50) NOT NULL,
  location            VARCHAR(100),
  is_treatment        BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customers_phone ON customers(phone_last4);
CREATE INDEX idx_sessions_customer ON visit_sessions(customer_id);
CREATE INDEX idx_sessions_store ON visit_sessions(store_code);
CREATE INDEX idx_sessions_date ON visit_sessions(session_start);
CREATE INDEX idx_fittings_session ON fitting_records(session_id);
CREATE INDEX idx_reasons_fitting ON non_purchase_reasons(fitting_id);
CREATE INDEX idx_prefs_customer ON customer_preferences(customer_id);
CREATE INDEX idx_memos_session ON interaction_memos(session_id);
CREATE INDEX idx_followups_customer ON follow_up_actions(customer_id);
CREATE INDEX idx_voc_session ON customer_voc(session_id);
CREATE INDEX idx_kpi_date_store ON daily_kpi_snapshots(snapshot_date, store_code);

-- Seed demo stores
INSERT INTO stores (store_code, store_name, brand, location, is_treatment) VALUES
  ('LOTTE_GD', '롯데백화점 건대점', '라코스테', '서울 광진구', TRUE),
  ('LOTTE_NW', '롯데백화점 노원점', '라코스테', '서울 노원구', TRUE),
  ('LOTTE_JD', '롯데백화점 중동점', '라코스테', '경기 부천시', TRUE),
  ('LOTTE_YDP', '롯데백화점 영등포점', '라코스테', '서울 영등포구', FALSE),
  ('AK_PT', 'AK플라자 평택점', '라코스테', '경기 평택시', FALSE);
