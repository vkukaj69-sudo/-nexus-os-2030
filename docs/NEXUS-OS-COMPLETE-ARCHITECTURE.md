# NEXUS OS - Complete System Architecture

## 2030 Evolution Build - Multi-Agent Orchestration Platform

---

## Overview

NEXUS OS is a sovereign AI operating system for creators, featuring a multi-agent architecture with 11 specialized agents, comprehensive services layer, and enterprise-grade infrastructure.

---

## Agent System (11 Agents)

### Core Orchestration

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **Oracle** | `oracle_core` | Master Orchestrator | Task routing, decomposition, multi-agent coordination |

### Intelligence & Research

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **Scryer** | `scryer_01` | Competitive Intelligence | Research, trend analysis, competitor intel, market research |

### Content Creation

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **Scribe** | `scribe_01` | Content Synthesis | Generate, transform, enhance content, hooks, threads |
| **Vulcan** | `vulcan_01` | Media Generation | Images (DALL-E), video (Runway), thumbnails, carousels |

### Memory & Identity

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **Mnemosyne** | `mnemosyne_01` | Memory Architecture | Store/retrieve memories, knowledge queries, Digital Soul |

### Security & Infrastructure

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **Sentinel** | `sentinel_01` | Hardware Security | TEE attestation, health checks, threat detection, audits |

### Brand & Engagement

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **BrandGuard** | `brandguard_01` | Brand Consistency | Voice alignment, risk assessment, content audits |
| **ReplyGuy** | `replyguy_01` | Engagement Automation | Reply drafting, engagement plans, DM drafts, approval queue |
| **CollabFinder** | `collabfinder_01` | Partnership Discovery | Find collaborators, score partners, outreach drafts |

### Builders

| Agent | ID | Specialty | Capabilities |
|-------|-----|-----------|--------------|
| **FunnelSmith** | `funnelsmith_01` | Funnel Builder | Landing pages, sales funnels, conversion optimization |
| **SiteForge** | `siteforge_01` | Micro-Websites | Quick site generation, templates, deployment |

---

## Services Layer

### 1. Memory Service
**Endpoint Prefix:** `/api/memory/*`

Hierarchical memory system with three tiers:

| Memory Type | Purpose | Features |
|-------------|---------|----------|
| **Episodic** | Event-based memories | Timestamp, context, emotional weight |
| **Semantic** | Facts & knowledge | Categorized, searchable, embeddings |
| **Procedural** | How-to knowledge | Agent-specific, action patterns |

**Endpoints:**
- `POST /api/memory/store` - Store memory (episodic/semantic/procedural)
- `POST /api/memory/recall` - Recall memories by type/query
- `POST /api/memory/consolidate` - Memory consolidation (short→long term)

---

### 2. Knowledge Graph Service
**Endpoint Prefix:** `/api/knowledge/*`

Entity-relationship graph for creator knowledge:

**Features:**
- Entity creation with types (person, brand, topic, content, etc.)
- Relationship mapping between entities
- Natural language graph queries
- Auto-extraction from text

**Endpoints:**
- `POST /api/knowledge/entity` - Create entity
- `POST /api/knowledge/search` - Search entities
- `GET /api/knowledge/entities/:type` - Get by type
- `POST /api/knowledge/relationship` - Create relationship
- `GET /api/knowledge/graph/:entityId` - Get entity graph (with depth)
- `POST /api/knowledge/query` - Natural language query
- `POST /api/knowledge/extract` - Extract entities from text

---

### 3. Reasoning Engine Service
**Endpoint Prefix:** `/api/reasoning/*`

Goal-oriented reasoning and decision-making:

**Features:**
- Goal creation and tracking
- Automatic goal decomposition into subtasks
- Chain-of-thought reasoning
- Decision making with options analysis

**Endpoints:**
- `POST /api/reasoning/goal` - Create goal
- `POST /api/reasoning/goal/:goalId/decompose` - Decompose goal
- `GET /api/reasoning/goals` - List goals (by status)
- `POST /api/reasoning/think` - Reason about input
- `POST /api/reasoning/decide` - Make decision
- `POST /api/reasoning/chain` - Chain of thought

---

### 4. Self-Improvement Service
**Endpoint Prefix:** `/api/improve/*`

Agent performance tracking and optimization:

**Features:**
- Performance metrics recording
- Feedback collection (ratings, comments)
- Performance analysis with AI
- A/B experimentation

**Endpoints:**
- `POST /api/improve/metric` - Record metric
- `GET /api/improve/stats/:agentId` - Get agent stats
- `POST /api/improve/feedback` - Submit feedback
- `GET /api/improve/improvements/:agentId` - Active improvements
- `GET /api/improve/analyze/:agentId` - AI performance analysis
- `POST /api/improve/experiment` - Create A/B experiment

---

### 5. Security Service
**Endpoint Prefix:** `/api/security/*`

Enterprise-grade security infrastructure:

**Features:**
- API key management (create, revoke, permissions)
- Audit logging
- Permission system (grant, check, revoke)
- Session management
- Security event tracking

**Endpoints:**
- `POST /api/security/apikey` - Create API key
- `GET /api/security/apikeys` - List API keys
- `DELETE /api/security/apikey/:keyId` - Revoke key
- `GET /api/security/audit` - Audit log
- `GET /api/security/events` - Security events
- `POST /api/security/permission` - Grant permission
- `GET /api/security/permission/check` - Check permission
- `POST /api/security/sessions/revoke-all` - Logout everywhere

---

### 6. Enterprise Service
**Endpoint Prefix:** `/api/org/*`, `/api/workspace/*`

Multi-tenant organization and team features:

**Features:**
- Organization management
- Team member invitations
- Role-based access (owner, admin, member, viewer)
- Workspaces for project isolation
- Resource sharing

**Endpoints:**
- `POST /api/org` - Create organization
- `GET /api/orgs` - User's organizations
- `GET /api/org/:orgId` - Organization details
- `POST /api/org/:orgId/invite` - Invite member
- `POST /api/invite/accept` - Accept invitation
- `POST /api/org/:orgId/workspace` - Create workspace
- `GET /api/workspaces` - User's workspaces
- `POST /api/share` - Share resource
- `PUT /api/org/:orgId/member/:userId` - Update member role

---

### 7. Workflow Engine Service
**Endpoint Prefix:** `/api/workflow/*`

Visual workflow automation:

**Features:**
- Workflow creation with nodes and edges
- Manual and webhook triggers
- Workflow execution with step tracking
- Run history and logs

**Endpoints:**
- `POST /api/workflow` - Create workflow
- `GET /api/workflows` - User's workflows
- `GET /api/workflow/:workflowId` - Workflow details + runs
- `PUT /api/workflow/:workflowId` - Update workflow
- `POST /api/workflow/:workflowId/run` - Execute workflow
- `GET /api/workflow/run/:runId` - Run details
- `POST /api/workflow/:workflowId/webhook` - Create webhook
- `POST /api/webhook/:endpointKey` - Trigger webhook (public)

---

### 8. Realtime Service
**Endpoint Prefix:** `/api/notifications/*`, `/api/channel/*`

Real-time communication and notifications:

**Features:**
- Push notifications
- Notification preferences
- Real-time channels (chat-like)
- Agent status tracking
- Message history

**Endpoints:**
- `GET /api/notifications` - Get notifications
- `POST /api/notification` - Create notification
- `PUT /api/notification/:notifId/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all read
- `GET /api/notifications/settings` - Get settings
- `PUT /api/notifications/settings` - Update settings
- `POST /api/channel` - Create channel
- `GET /api/channels` - User's channels
- `POST /api/channel/:channelId/message` - Send message
- `GET /api/channel/:channelId/messages` - Get messages
- `GET /api/agents/status` - Agent statuses
- `PUT /api/agent/:agentId/status` - Update agent status

---

### 9. Analytics Service
**Endpoint Prefix:** `/api/analytics/*`

Usage tracking and insights:

**Features:**
- Event tracking
- Usage statistics
- Agent performance metrics
- Custom dashboards
- AI-generated insights
- System health monitoring

**Endpoints:**
- `POST /api/analytics/event` - Track event
- `GET /api/analytics/usage` - Usage stats
- `GET /api/analytics/agents` - Usage by agent
- `GET /api/analytics/timeline` - Usage timeline
- `GET /api/analytics/agent/:agentId` - Agent performance
- `GET /api/analytics/insights` - AI insights
- `GET /api/analytics/daily` - Daily metrics
- `POST /api/analytics/dashboard` - Create dashboard
- `GET /api/analytics/dashboards` - Get dashboards
- `GET /api/analytics/health` - System health

---

### 10. Plugin & AI Router Service
**Endpoint Prefix:** `/api/ai/*`, `/api/plugin/*`

Multi-provider AI routing and plugin marketplace:

**Features:**
- Multiple AI provider support (Gemini, OpenAI, Perplexity, etc.)
- Smart request routing based on rules
- Plugin marketplace
- Plugin installation/management
- Reviews and ratings

**Endpoints:**
- `GET /api/ai/providers` - Available providers
- `POST /api/ai/provider/:providerId/key` - Set API key
- `POST /api/ai/route` - Route AI request
- `POST /api/ai/routing-rule` - Create routing rule
- `GET /api/ai/routing-rules` - Get rules
- `GET /api/plugins` - Plugin marketplace
- `GET /api/plugin/:pluginId` - Plugin details
- `POST /api/plugin` - Create plugin
- `POST /api/plugin/:pluginId/install` - Install
- `DELETE /api/plugin/:pluginId/uninstall` - Uninstall
- `GET /api/plugins/installed` - Installed plugins
- `PUT /api/plugin/:pluginId/toggle` - Enable/disable
- `POST /api/plugin/:pluginId/review` - Add review

---

## Core API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (returns JWT)

### System
- `GET /api/health` - Health check
- `GET /api/status` - Full system status

### Agents
- `GET /api/agents/list` - List all agents
- `GET /api/agents/:id` - Agent details
- `POST /api/agents/:id/task` - Execute task on agent

### Agent-Specific Endpoints
- `POST /api/oracle/execute` - Orchestrated multi-agent task
- `POST /api/scryer/analyze` - Intelligence query
- `POST /api/scribe/generate` - Generate content
- `POST /api/scribe/transform` - Transform content
- `POST /api/brandguard/check` - Brand alignment check
- `POST /api/replyguy/draft` - Draft reply
- `GET /api/replyguy/queue` - Get reply queue
- `POST /api/collabfinder/find` - Find collaborators
- `POST /api/funnelsmith/create` - Create funnel/landing page
- `POST /api/siteforge/create` - Create microsite

### Digital Soul
- `POST /api/soul/ingest` - Store soul data
- `GET /api/soul/retrieve` - Retrieve soul

---

## Infrastructure

### Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | PostgreSQL |
| Cache/Queue | Redis + BullMQ |
| Auth | JWT + bcrypt |
| Security | Helmet, CORS |
| AI Providers | Gemini, Perplexity, OpenAI |

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Auth
JWT_SECRET=...

# AI APIs
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
OPENAI_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Server
PORT=3001
NODE_ENV=development
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXUS OS                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Frontend (React)                      │    │
│  │  Dashboard │ AgentHub │ Composer │ Settings │ etc...    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                         REST API                                 │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Express.js Server                       │    │
│  │  Auth │ Middleware │ Routes │ Error Handling            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌──────────────────────────┴───────────────────────────┐       │
│  │                                                       │       │
│  │  ┌─────────────────┐    ┌─────────────────────────┐  │       │
│  │  │  Agent Registry │    │      Services Layer     │  │       │
│  │  │                 │    │                         │  │       │
│  │  │  11 Agents:     │    │  - MemoryService       │  │       │
│  │  │  - Oracle       │    │  - KnowledgeService    │  │       │
│  │  │  - Scryer       │    │  - ReasoningService    │  │       │
│  │  │  - Scribe       │    │  - SelfImprovement     │  │       │
│  │  │  - Sentinel     │    │  - SecurityService     │  │       │
│  │  │  - Mnemosyne    │    │  - EnterpriseService   │  │       │
│  │  │  - Vulcan       │    │  - WorkflowService     │  │       │
│  │  │  - BrandGuard   │    │  - RealtimeService     │  │       │
│  │  │  - ReplyGuy     │    │  - AnalyticsService    │  │       │
│  │  │  - CollabFinder │    │  - PluginService       │  │       │
│  │  │  - FunnelSmith  │    │                         │  │       │
│  │  │  - SiteForge    │    │                         │  │       │
│  │  └─────────────────┘    └─────────────────────────┘  │       │
│  │                                                       │       │
│  └───────────────────────────────────────────────────────┘       │
│                              │                                   │
│  ┌──────────────────────────┴───────────────────────────┐       │
│  │                   Data Layer                          │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │       │
│  │  │ PostgreSQL  │  │    Redis    │  │   BullMQ    │   │       │
│  │  │  (Primary)  │  │   (Cache)   │  │   (Queue)   │   │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │       │
│  └───────────────────────────────────────────────────────┘       │
│                              │                                   │
│  ┌──────────────────────────┴───────────────────────────┐       │
│  │                 External APIs                         │       │
│  │  Gemini │ Perplexity │ OpenAI │ DALL-E │ Runway      │       │
│  └───────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
nexus-os-build/
├── frontend/
│   ├── views/              # 35 React view components
│   ├── components/         # Shared components
│   ├── context/            # React context (SoulContext)
│   ├── api/                # API client (nexusClient.ts)
│   ├── App.tsx
│   ├── index.tsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── BaseAgent.js
│   │   │   ├── AgentRegistry.js
│   │   │   ├── index.js
│   │   │   ├── oracle/
│   │   │   ├── scryer/
│   │   │   ├── scribe/
│   │   │   ├── sentinel/
│   │   │   ├── mnemosyne/
│   │   │   ├── vulcan/
│   │   │   ├── brandguard/
│   │   │   ├── replyguy/
│   │   │   ├── collabfinder/
│   │   │   ├── funnelsmith/
│   │   │   └── siteforge/
│   │   │
│   │   ├── services/
│   │   │   ├── MemoryService.js
│   │   │   ├── KnowledgeService.js
│   │   │   ├── ReasoningService.js
│   │   │   ├── SelfImprovementService.js
│   │   │   ├── SecurityService.js
│   │   │   ├── EnterpriseService.js
│   │   │   ├── WorkflowService.js
│   │   │   ├── RealtimeService.js
│   │   │   ├── AnalyticsService.js
│   │   │   └── PluginService.js
│   │   │
│   │   └── index.js        # Express server
│   │
│   ├── package.json
│   └── .env
│
├── shared/                 # Shared types/utils
├── docs/                   # Documentation
└── scripts/                # Build/deploy scripts
```

---

## Summary Stats

| Category | Count |
|----------|-------|
| **Agents** | 11 |
| **Services** | 10 |
| **API Endpoints** | 100+ |
| **Frontend Views** | 35 |
| **Total Files** | 75+ |

---

## Next Steps

1. **Database Schema** - Create PostgreSQL tables for all services
2. **Service Implementation** - Complete service classes
3. **Frontend Integration** - Connect React views to new endpoints
4. **Testing** - Unit and integration tests
5. **Deployment** - GCP/Vercel deployment scripts
6. **Documentation** - API documentation (OpenAPI/Swagger)

---

*NEXUS OS - 2030 Evolution Build*
*Multi-Agent Orchestration for Sovereign Creators*
