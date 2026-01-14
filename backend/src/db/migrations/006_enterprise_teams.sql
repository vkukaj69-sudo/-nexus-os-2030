-- NEXUS OS Enterprise Features
-- Sprint 6: Teams & Workspaces

-- Organizations / Teams
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{"members": 5, "agents": 10, "storage_gb": 10}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_owner ON organizations(owner_id);

-- Organization members
CREATE TABLE IF NOT EXISTS org_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '[]',
    invited_by INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_orgmem_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_orgmem_user ON org_members(user_id);

-- Workspaces (projects within orgs)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workspace_type VARCHAR(50) DEFAULT 'general' CHECK (workspace_type IN ('general', 'marketing', 'sales', 'support', 'development', 'research')),
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_org ON workspaces(org_id);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wsmem_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wsmem_user ON workspace_members(user_id);

-- Shared resources
CREATE TABLE IF NOT EXISTS shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('memory', 'entity', 'goal', 'improvement', 'prompt', 'template')),
    resource_id UUID NOT NULL,
    shared_by INTEGER REFERENCES users(id),
    access_level VARCHAR(50) DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_org ON shared_resources(org_id);
CREATE INDEX IF NOT EXISTS idx_shared_workspace ON shared_resources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shared_resource ON shared_resources(resource_type, resource_id);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invite_email ON invitations(email);
