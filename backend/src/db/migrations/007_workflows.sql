-- NEXUS OS Workflow Engine
-- Sprint 7: Autonomous Operations

-- Workflow templates
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'event', 'webhook')),
    trigger_config JSONB DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    trigger_source VARCHAR(50),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    step_results JSONB DEFAULT '[]',
    current_step INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_time ON workflow_runs(created_at);

-- Scheduled tasks
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    next_run_at TIMESTAMP,
    last_run_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_active ON scheduled_tasks(is_active, next_run_at);

-- Event triggers
CREATE TABLE IF NOT EXISTS event_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    triggered_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triggers_event ON event_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_triggers_active ON event_triggers(is_active);

-- Webhooks for external triggers
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    endpoint_key VARCHAR(64) UNIQUE NOT NULL,
    secret_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    call_count INTEGER DEFAULT 0,
    last_called_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_key ON webhooks(endpoint_key);
