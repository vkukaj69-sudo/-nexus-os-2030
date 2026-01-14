-- NEXUS OS Reasoning Engine Tables
-- Sprint 3: Intelligence Layer

-- Goals and objectives
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) DEFAULT 'task' CHECK (goal_type IN ('task', 'project', 'objective', 'milestone')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed', 'paused')),
    priority INTEGER DEFAULT 5,
    progress FLOAT DEFAULT 0,
    deadline TIMESTAMP,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- Reasoning chains (thought process)
CREATE TABLE IF NOT EXISTS reasoning_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id),
    trigger_input TEXT NOT NULL,
    chain_type VARCHAR(50) DEFAULT 'analysis' CHECK (chain_type IN ('analysis', 'planning', 'decision', 'evaluation', 'creative')),
    steps JSONB DEFAULT '[]',
    conclusion TEXT,
    confidence FLOAT DEFAULT 0.5,
    tokens_used INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_user ON reasoning_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_goal ON reasoning_chains(goal_id);

-- Decisions log
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reasoning_chain_id UUID REFERENCES reasoning_chains(id),
    decision_type VARCHAR(50) NOT NULL,
    options JSONB DEFAULT '[]',
    chosen_option JSONB,
    rationale TEXT,
    outcome VARCHAR(50) CHECK (outcome IN ('pending', 'success', 'partial', 'failure')),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_user ON decisions(user_id);
