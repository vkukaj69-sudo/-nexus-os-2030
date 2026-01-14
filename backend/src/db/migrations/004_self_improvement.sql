-- NEXUS OS Self-Improvement System
-- Sprint 4: Learning & Adaptation

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('success_rate', 'response_time', 'user_rating', 'task_completion', 'accuracy')),
    value FLOAT NOT NULL,
    context JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_user ON agent_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_perf_agent ON agent_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_perf_time ON agent_performance(recorded_at);

-- Feedback and ratings
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50) NOT NULL,
    interaction_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) DEFAULT 'general' CHECK (feedback_type IN ('general', 'accuracy', 'helpfulness', 'speed', 'tone')),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_agent ON feedback(agent_id);

-- Learned improvements
CREATE TABLE IF NOT EXISTS improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50),
    improvement_type VARCHAR(50) NOT NULL CHECK (improvement_type IN ('prompt_adjustment', 'behavior_rule', 'preference', 'skill')),
    trigger_pattern TEXT,
    improvement TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'feedback' CHECK (source IN ('feedback', 'performance', 'explicit', 'inferred')),
    effectiveness FLOAT DEFAULT 0.5,
    times_applied INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_improvements_agent ON improvements(agent_id);
CREATE INDEX IF NOT EXISTS idx_improvements_active ON improvements(active);

-- A/B test experiments
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    results_a JSONB DEFAULT '{"trials": 0, "successes": 0}',
    results_b JSONB DEFAULT '{"trials": 0, "successes": 0}',
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),
    winner VARCHAR(1) CHECK (winner IN ('a', 'b')),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
