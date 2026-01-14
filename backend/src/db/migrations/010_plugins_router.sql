-- NEXUS OS Plugin & Router System
-- Sprint 10: Universal AI & Extensions

-- AI model providers
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google', 'local', 'custom')),
    base_url VARCHAR(500),
    models JSONB DEFAULT '[]',
    default_model VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_type ON ai_providers(provider_type);

-- User API keys for providers
CREATE TABLE IF NOT EXISTS user_provider_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
    api_key_encrypted TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_keys_user ON user_provider_keys(user_id);

-- Model routing rules
CREATE TABLE IF NOT EXISTS routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    conditions JSONB DEFAULT '{}',
    target_provider VARCHAR(100),
    target_model VARCHAR(100),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_user ON routing_rules(user_id);

-- Plugins registry
CREATE TABLE IF NOT EXISTS plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    author VARCHAR(255),
    category VARCHAR(50) CHECK (category IN ('integration', 'agent', 'workflow', 'analytics', 'utility', 'theme')),
    icon_url VARCHAR(500),
    config_schema JSONB DEFAULT '{}',
    endpoints JSONB DEFAULT '[]',
    is_official BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    install_count INTEGER DEFAULT 0,
    rating FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category);
CREATE INDEX IF NOT EXISTS idx_plugins_slug ON plugins(slug);

-- User installed plugins
CREATE TABLE IF NOT EXISTS installed_plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    installed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, plugin_id)
);

CREATE INDEX IF NOT EXISTS idx_installed_user ON installed_plugins(user_id);

-- Plugin marketplace reviews
CREATE TABLE IF NOT EXISTS plugin_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_plugin ON plugin_reviews(plugin_id);

-- Insert default AI providers
INSERT INTO ai_providers (name, provider_type, base_url, models, default_model) VALUES
('OpenAI', 'openai', 'https://api.openai.com/v1', '["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]', 'gpt-4o'),
('Anthropic', 'anthropic', 'https://api.anthropic.com/v1', '["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]', 'claude-3-sonnet'),
('Google AI', 'google', 'https://generativelanguage.googleapis.com/v1', '["gemini-2.0-flash", "gemini-pro"]', 'gemini-2.0-flash'),
('Local/Ollama', 'local', 'http://localhost:11434', '["llama2", "mistral", "codellama"]', 'llama2')
ON CONFLICT (name) DO NOTHING;
