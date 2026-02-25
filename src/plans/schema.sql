-- ============================================================
--  IdeaSpark — Plan Engine  PostgreSQL Schema
--  Run this against your PostgreSQL database before starting.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────

CREATE TYPE plan_objective AS ENUM (
    'brand_awareness',
    'lead_generation',
    'sales_conversion',
    'audience_growth',
    'product_launch',
    'seasonal_campaign'
);

CREATE TYPE plan_status AS ENUM ('draft', 'active', 'completed');

CREATE TYPE content_format AS ENUM ('reel', 'carousel', 'story', 'post');

CREATE TYPE cta_type AS ENUM ('soft', 'hard', 'educational');

CREATE TYPE content_block_status AS ENUM ('draft', 'scheduled', 'edited');

CREATE TYPE calendar_entry_status AS ENUM ('scheduled', 'published', 'cancelled');

-- ─── Plans ───────────────────────────────────────────────────

CREATE TABLE plans (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id                VARCHAR(24)     NOT NULL,           -- MongoDB ObjectId ref
    user_id                 VARCHAR(24)     NOT NULL,           -- MongoDB ObjectId ref
    name                    VARCHAR(200)    NOT NULL,
    objective               plan_objective  NOT NULL,
    start_date              DATE            NOT NULL,
    end_date                DATE            NOT NULL,
    duration_weeks          INT             NOT NULL CHECK (duration_weeks BETWEEN 1 AND 52),
    promotion_intensity     VARCHAR(20)     NOT NULL DEFAULT 'balanced'
                                CHECK (promotion_intensity IN ('low', 'balanced', 'aggressive')),
    posting_frequency       INT             NOT NULL DEFAULT 3
                                CHECK (posting_frequency BETWEEN 1 AND 14),
    platforms               TEXT[]          NOT NULL DEFAULT '{}',
    product_ids             TEXT[]          NOT NULL DEFAULT '{}',
    content_mix_preference  JSONB           NOT NULL DEFAULT
                                '{"educational":25,"promotional":25,"storytelling":25,"authority":25}',
    status                  plan_status     NOT NULL DEFAULT 'draft',
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─── Phases ──────────────────────────────────────────────────

CREATE TABLE phases (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id     UUID        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    week_number INT         NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Content Blocks ──────────────────────────────────────────

CREATE TABLE content_blocks (
    id                      UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id                UUID                    NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    title                   VARCHAR(300)            NOT NULL,
    pillar                  VARCHAR(100)            NOT NULL,
    product_id              VARCHAR(24),
    format                  content_format          NOT NULL,
    cta_type                cta_type                NOT NULL,
    emotional_trigger       VARCHAR(200),
    recommended_day_offset  INT                     NOT NULL DEFAULT 0,
    recommended_time        VARCHAR(10),
    status                  content_block_status    NOT NULL DEFAULT 'draft',
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ─── Calendar Entries ────────────────────────────────────────

CREATE TABLE calendar_entries (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id             UUID                    NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    content_block_id    UUID                    NOT NULL REFERENCES content_blocks(id),
    brand_id            VARCHAR(24)             NOT NULL,
    user_id             VARCHAR(24)             NOT NULL,
    scheduled_date      DATE                    NOT NULL,
    scheduled_time      VARCHAR(10),
    platform            VARCHAR(50)             NOT NULL,
    status              calendar_entry_status   NOT NULL DEFAULT 'scheduled',
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX idx_plans_brand_id       ON plans(brand_id);
CREATE INDEX idx_plans_user_id        ON plans(user_id);
CREATE INDEX idx_plans_status         ON plans(status);
CREATE INDEX idx_phases_plan_id       ON phases(plan_id);
CREATE INDEX idx_phases_week          ON phases(plan_id, week_number);
CREATE INDEX idx_content_blocks_phase ON content_blocks(phase_id);
CREATE INDEX idx_cal_brand_date       ON calendar_entries(brand_id, scheduled_date);
CREATE INDEX idx_cal_plan             ON calendar_entries(plan_id);

-- ─── Auto-update updated_at ──────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_plans
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_content_blocks
    BEFORE UPDATE ON content_blocks
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_calendar_entries
    BEFORE UPDATE ON calendar_entries
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
