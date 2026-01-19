-- NEXUS LEVIATHAN - Complete Database Schema
-- Sprint X: Digital Leviathan Evolution

-- ═══════════════════════════════════════════════════════════════════════
-- ATTENTION ARBITRAGE ENGINE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attention_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(500) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    search_volume INTEGER DEFAULT 0,
    competition_score FLOAT DEFAULT 0.5,
    quality_score FLOAT DEFAULT 0.5,
    opportunity_score FLOAT GENERATED ALWAYS AS (
        CASE WHEN competition_score = 0 THEN search_volume::float * (1 - quality_score)
        ELSE (search_volume::float / competition_score) * (1 - quality_score)
        END
    ) STORED,
    keywords JSONB DEFAULT '[]',
    discovered_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exploited'))
);

CREATE INDEX IF NOT EXISTS idx_attention_opportunity ON attention_gaps(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_attention_platform ON attention_gaps(platform, status);
CREATE INDEX IF NOT EXISTS idx_attention_expires ON attention_gaps(expires_at);

CREATE TABLE IF NOT EXISTS arbitrage_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    gap_id UUID REFERENCES attention_gaps(id) ON DELETE SET NULL,
    strategy JSONB NOT NULL DEFAULT '{}',
    content_pieces JSONB DEFAULT '[]',
    performance JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON arbitrage_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON arbitrage_campaigns(status);

-- ═══════════════════════════════════════════════════════════════════════
-- SYNTHETIC PERSONA SIMULATOR
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS synthetic_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archetype VARCHAR(100) NOT NULL,
    demographics JSONB NOT NULL DEFAULT '{}',
    psychographics JSONB NOT NULL DEFAULT '{}',
    behavior_patterns JSONB DEFAULT '{}',
    engagement_weights JSONB DEFAULT '{}',
    accuracy_score FLOAT DEFAULT 0.5,
    simulations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_archetype ON synthetic_personas(archetype);

CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50),
    content TEXT NOT NULL,
    platform VARCHAR(50),
    persona_count INTEGER DEFAULT 1000,
    results JSONB DEFAULT '{}',
    predicted_metrics JSONB DEFAULT '{}',
    actual_metrics JSONB,
    accuracy_score FLOAT,
    simulated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_accuracy ON simulations(accuracy_score);

CREATE TABLE IF NOT EXISTS simulation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES synthetic_personas(id) ON DELETE SET NULL,
    reaction VARCHAR(50),
    engagement_probability FLOAT,
    reasoning TEXT,
    emotional_response JSONB
);

CREATE INDEX IF NOT EXISTS idx_sim_feedback_simulation ON simulation_feedback(simulation_id);

-- ═══════════════════════════════════════════════════════════════════════
-- FEEDBACK LEDGER (CROSS-PLATFORM TRACKING)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'post',
    posted_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON content_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_external ON content_posts(external_id);

CREATE TABLE IF NOT EXISTS feedback_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    value FLOAT NOT NULL,
    source VARCHAR(50) DEFAULT 'first_party' CHECK (source IN ('first_party', 'third_party', 'inferred')),
    collected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_post ON feedback_ledger(post_id);
CREATE INDEX IF NOT EXISTS idx_ledger_metric ON feedback_ledger(metric_type);

CREATE TABLE IF NOT EXISTS sentiment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
    mention_url TEXT,
    sentiment_score FLOAT,
    emotion JSONB DEFAULT '{}',
    influence_score FLOAT DEFAULT 0,
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_post ON sentiment_tracking(post_id);

-- ═══════════════════════════════════════════════════════════════════════
-- PHILOSOPHY ENGINE (META-LEARNING)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS philosophy_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('content_strategy', 'platform_preference', 'timing', 'tone', 'topic_selection', 'engagement', 'monetization')),
    condition JSONB NOT NULL DEFAULT '{}',
    action JSONB NOT NULL DEFAULT '{}',
    confidence FLOAT DEFAULT 0.5,
    times_applied INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_philosophy_user ON philosophy_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_philosophy_type ON philosophy_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_philosophy_active ON philosophy_rules(is_active, confidence DESC);

CREATE TABLE IF NOT EXISTS philosophy_evolution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    old_rules JSONB,
    new_rules JSONB,
    trigger_event TEXT,
    reasoning TEXT,
    evolved_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_user ON philosophy_evolution_log(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- GHOST PROTOCOL (EVASION LAYER)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS proxy_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_type VARCHAR(50) DEFAULT 'residential' CHECK (node_type IN ('residential', 'datacenter', 'mobile', 'citizen')),
    ip_address VARCHAR(45) NOT NULL,
    port INTEGER DEFAULT 80,
    geo_location JSONB DEFAULT '{}',
    health_score FLOAT DEFAULT 1.0,
    last_used TIMESTAMP,
    ban_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proxy_active ON proxy_nodes(is_active, health_score DESC);
CREATE INDEX IF NOT EXISTS idx_proxy_geo ON proxy_nodes USING GIN(geo_location);

CREATE TABLE IF NOT EXISTS browser_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint_data JSONB NOT NULL DEFAULT '{}',
    user_agent TEXT,
    screen_resolution VARCHAR(20),
    timezone VARCHAR(50),
    languages JSONB DEFAULT '["en-US"]',
    webgl_hash VARCHAR(64),
    canvas_hash VARCHAR(64),
    uses INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 50,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fingerprint_uses ON browser_fingerprints(uses, max_uses);

CREATE TABLE IF NOT EXISTS platform_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    session_data JSONB DEFAULT '{}',
    cookies JSONB DEFAULT '{}',
    fingerprint_id UUID REFERENCES browser_fingerprints(id) ON DELETE SET NULL,
    proxy_id UUID REFERENCES proxy_nodes(id) ON DELETE SET NULL,
    health VARCHAR(50) DEFAULT 'healthy' CHECK (health IN ('healthy', 'warning', 'banned', 'expired')),
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON platform_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON platform_sessions(platform, health);

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    limit_per_hour INTEGER DEFAULT 10,
    limit_per_day INTEGER DEFAULT 100,
    cooldown_seconds INTEGER DEFAULT 60,
    current_hour_count INTEGER DEFAULT 0,
    current_day_count INTEGER DEFAULT 0,
    last_reset TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, action_type)
);

CREATE INDEX IF NOT EXISTS idx_rate_platform ON rate_limits(platform);

-- Default rate limits for major platforms
INSERT INTO rate_limits (platform, action_type, limit_per_hour, limit_per_day, cooldown_seconds) VALUES
    ('twitter', 'post', 5, 50, 300),
    ('twitter', 'like', 20, 200, 30),
    ('twitter', 'follow', 10, 100, 60),
    ('twitter', 'reply', 10, 100, 60),
    ('linkedin', 'post', 3, 20, 600),
    ('linkedin', 'like', 30, 300, 20),
    ('linkedin', 'comment', 10, 100, 60),
    ('reddit', 'post', 2, 10, 900),
    ('reddit', 'comment', 10, 100, 60),
    ('tiktok', 'post', 3, 10, 3600),
    ('instagram', 'post', 5, 25, 600),
    ('instagram', 'like', 30, 300, 20)
ON CONFLICT (platform, action_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- REVENUE ENGINE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    link_code VARCHAR(50) UNIQUE NOT NULL,
    destination_url TEXT DEFAULT 'https://nexus-os.ai',
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_user ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_code ON affiliate_links(link_code);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    referred_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    compute_credits_earned INTEGER DEFAULT 0,
    revenue_share DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE TABLE IF NOT EXISTS auto_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_type VARCHAR(50) CHECK (product_type IN ('micro_course', 'ebook', 'template', 'tool', 'community', 'service')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    stripe_product_id VARCHAR(100),
    stripe_price_id VARCHAR(100),
    price DECIMAL(10, 2) DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    trigger_event TEXT,
    auto_generated BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_user ON auto_products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON auto_products(status);

CREATE TABLE IF NOT EXISTS yield_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    opportunity_type VARCHAR(50),
    topic VARCHAR(255),
    estimated_revenue DECIMAL(10, 2),
    confidence FLOAT DEFAULT 0.5,
    action_plan JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'analyzing', 'ready', 'converted', 'expired')),
    discovered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yield_user ON yield_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_yield_status ON yield_opportunities(status);

CREATE TABLE IF NOT EXISTS compute_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL,
    neural_intensity FLOAT DEFAULT 0.3,
    tokens_used INTEGER DEFAULT 0,
    compute_cost DECIMAL(10, 4) DEFAULT 0,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compute_user ON compute_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_compute_time ON compute_usage(timestamp);

-- Add compute_credits column to users if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'compute_credits') THEN
        ALTER TABLE users ADD COLUMN compute_credits INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
        ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'free';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Function to auto-expire attention gaps
CREATE OR REPLACE FUNCTION expire_attention_gaps() RETURNS void AS $$
BEGIN
    UPDATE attention_gaps SET status = 'expired' WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily rate limits
CREATE OR REPLACE FUNCTION reset_daily_rate_limits() RETURNS void AS $$
BEGIN
    UPDATE rate_limits SET current_day_count = 0, last_reset = NOW()
    WHERE last_reset < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to reset hourly rate limits
CREATE OR REPLACE FUNCTION reset_hourly_rate_limits() RETURNS void AS $$
BEGIN
    UPDATE rate_limits SET current_hour_count = 0
    WHERE last_reset < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_platform ON content_posts(user_id, platform, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_compute_user_day ON compute_usage(user_id, timestamp) WHERE timestamp > NOW() - INTERVAL '1 day';
