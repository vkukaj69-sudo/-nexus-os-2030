# NEXUS OS - Development Context

Last updated: 2026-01-17

## Project Overview
NEXUS OS is a multi-agent AI platform with 11 specialized agents running on GCP.

## Current State

### Frontend (Vercel)
- **URL**: nexus-os.ai
- **Tech**: Next.js 14, TypeScript, Tailwind CSS
- **Location**: `/Users/makeme/nexus-os-build/frontend`

### Backend (GCP VM)
- **API**: api.nexus-os.ai
- **Tech**: Node.js, Express, PM2
- **Location**: `/Users/makeme/nexus-os-build/backend`
- **DB**: PostgreSQL at 34.29.253.64:5432

### Auth
- Email: vinnyk72@yahoo.com
- Role: sovereign
- Token hardcoded in `/frontend/src/lib/api.ts`

## Recently Built (Jan 2026)

### Studios UI
User-friendly interfaces for non-technical users:

1. **Video Studio** (`/studio/video`)
   - Veo 3.1 with native audio
   - Duration: 4, 6, 8 seconds
   - Aspect: 16:9 or 9:16
   - Backend: VulcanAgent

2. **Content Studio** (`/studio/content`)
   - Platforms: Twitter, LinkedIn, Instagram, Facebook, Threads
   - Types: Post, Hooks, Thread
   - Transform between platforms
   - Backend: ScribeAgent

3. **Research Studio** (`/studio/research`)
   - Google Trends analysis
   - Keyword comparison
   - Regional interest
   - Backend: ScryerAgent

### Sidebar Updated
- New "Studios" section at top with gradient icons
- Platform tools below for power users

## 11 Agents

| Agent | Purpose |
|-------|---------|
| Nexus Prime | Orchestration & routing |
| Scribe | Content generation |
| Vulcan | Video generation (Veo 3.1) |
| Scryer | Research & trends |
| Oracle | Analytics & predictions |
| Sentinel | Security monitoring |
| Weaver | Workflow automation |
| Archivist | Memory & knowledge |
| Herald | Notifications |
| Aegis | Authentication |
| Synapse | Plugin system |

## Key Files

```
/frontend/src/
├── app/
│   ├── page.tsx              # Main dashboard
│   └── studio/
│       ├── video/page.tsx    # Video Studio
│       ├── content/page.tsx  # Content Studio
│       └── research/page.tsx # Research Studio
├── components/
│   └── Sidebar.tsx           # Navigation
└── lib/
    └── api.ts                # API client

/backend/src/
├── agents/
│   ├── vulcan/VulcanAgent.js # Veo 3.1 video
│   ├── scribe/ScribeAgent.js # Content gen
│   └── scryer/ScryerAgent.js # Trends/research
└── index.js                  # Express server
```

## Git Tags
- `backup-pre-ux-rebuild-20260117` - Before studios rebuild

## Known Issues
- Large screenshots can freeze Claude Code (use /compact first)
- JWT token expires - check exp date if auth fails

## Deploy Commands

```bash
# Frontend (auto-deploys on push)
cd /Users/makeme/nexus-os-build/frontend
git add . && git commit -m "message" && git push

# Backend (SSH to GCP)
ssh nexus-vm
cd /app && git pull && pm2 restart all
```

## What's Next
- Settings page
- Onboarding flow for new users
- More analytics in Research Studio
