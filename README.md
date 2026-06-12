# TaskMarket

A two-sided task marketplace (Airtasker-style). **Phase 1** is the web platform; Phase 2 will be
native mobile apps consuming the **same** JSON API.

The core loop, end to end:

```
post a task → receive offers → hire → chat → pay (escrow) → complete → release → review
```

All business logic lives behind a versioned `/v1` JSON API; the web app is a thin client.
See [`CLAUDE.md`](./CLAUDE.md) for the full project context, stack, and conventions.

## Repo layout

| Path                 | What                                                              |
| -------------------- | ---------------------------------------------------------------- |
| `/api`               | FastAPI service — all business logic + the `/v1` API ([README](./api/README.md)) |
| `/web`               | Next.js 14 web client ([README](./web/README.md))                |
| `docker-compose.yml` | Local Postgres 16                                                |
| `CLAUDE.md`          | Project context, stack, golden rules, scope                      |

The two apps are separate processes that talk over HTTP.

## Stack

- **Web**: Next.js 14 (App Router, TS) · Tailwind · shadcn/ui (Tailwind v3) · TanStack Query ·
  React Hook Form + Zod · Clerk (v6).
- **API**: FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL (psycopg v3) · Pydantic v2.
- **Integrations**: Clerk (auth) · Razorpay test mode (payments) · Cloudflare R2 (uploads) ·
  Resend (email). Each has a **dev fallback** so the app runs end-to-end without any external keys.

## Quick start (no external keys needed)

The app runs fully locally using built-in dev fallbacks — Clerk auth is bypassed, uploads and
payments are simulated, and emails are logged instead of sent.

```bash
# 1. Start Postgres
docker compose up -d

# 2. API  (terminal 1)
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # ships with DEV_AUTH_BYPASS=true
alembic upgrade head
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)

# 3. Web  (terminal 2)
cd web
npm install
cp .env.example .env.local      # add Clerk keys to sign in via the browser
npm run dev                     # http://localhost:3000
```

> The browser UI's signed-in features (post, offer, chat, pay, review) need real **Clerk** keys
> to mint a session token. Without them, public pages (browse, task detail, profiles) work, and
> the **entire backend** is exercisable via `curl` using the dev auth bypass — see
> [`api/README.md`](./api/README.md).

## The full loop (verified end to end)

Using the dev fallbacks, two identities (a poster and a tasker) complete the whole Phase-1 loop:

`post → offer → accept → pay (held) → chat → complete → release (15% fee) → review`,

with ratings recomputed and notifications fired at each step. See the verification + real
Razorpay test-mode walkthrough in [`api/README.md`](./api/README.md#payments-razorpay-test-mode).

## Milestones

Phase 1 was built in milestones **M0–M7**, one commit each:

| Milestone | What it added |
| --------- | ------------- |
| M0 | Scaffold: FastAPI + Next.js apps, Postgres, Clerk JWT, `/v1/health` + `/v1/me` |
| M1 | Profiles & roles; avatar upload (R2 + dev fallback) |
| M2 | Tasks: post (multi-step wizard) + browse with filters |
| M3 | Offers: make/accept/withdraw; assignment |
| M4 | Messaging tied to a task (polling) |
| M5 | Payments: Razorpay test mode escrow (authorize → capture, 15% fee) |
| M6 | Reviews & trust signals (ratings + completion rate) |
| M7 | Notifications (in-app + Resend email) + polish (rate limiting, skeletons, error boundary) |

## Out of scope for Phase 1

Per `CLAUDE.md`: insurance, AI task-writing, automated disputes/refunds, advanced badges
(background checks, trade licenses), offer-expiry timers, recurring tasks, business/team
accounts, and native mobile apps.
