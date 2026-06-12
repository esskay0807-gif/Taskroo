# TaskMarket

A two-sided task marketplace (Airtasker-style). Phase 1 is the web platform; Phase 2 will be
native mobile apps consuming the **same** JSON API.

The core loop: post a task → receive offers → hire → chat → pay (escrow) → complete → review.

See [`CLAUDE.md`](./CLAUDE.md) for the full project context, stack, and conventions.

## Repo layout

| Path   | What                                          |
| ------ | --------------------------------------------- |
| `/api` | FastAPI service — all business logic + `/v1` API ([README](./api/README.md)) |
| `/web` | Next.js 14 web client ([README](./web/README.md)) |
| `docker-compose.yml` | Local Postgres 16 |

The two apps are separate and talk over HTTP.

## Quick start (M0)

```bash
# 1. Start Postgres
docker compose up -d

# 2. API — see api/README.md
cd api && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload   # http://localhost:8000

# 3. Web — see web/README.md (new terminal)
cd web && npm install
cp .env.example .env.local      # add your Clerk keys
npm run dev                     # http://localhost:3000
```

## Milestones
Phase 1 is built in milestones **M0–M7** (scaffold → profiles → tasks → offers → messaging →
payments → reviews → notifications). M0 is the scaffold only — no features.
