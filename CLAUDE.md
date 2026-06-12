# TaskMarket — Project Context

## What we're building
A two-sided task marketplace (Airtasker-style). Phase 1 is the web platform.
Phase 2 will be native mobile apps consuming the SAME API. Build accordingly.

The core loop, end to end:
post a task → receive offers → hire → chat → pay (escrow) → complete → review.

## Golden rules
1. ALL business logic lives behind the JSON API. The web frontend is just a client.
   Phase 2 mobile will be a second client of the same API. No business logic in the frontend.
2. Build incrementally, one milestone at a time. Do not scaffold features from future milestones.
3. PLAN before you code. For any non-trivial task, outline the files you'll touch and wait
   if the plan is large. Prefer simple, readable code over clever abstractions.
4. ASK before adding any dependency not in the stack below.
5. After finishing work: actually run it (lint, type-check, start the server) and confirm
   it works before telling me it's done. Never claim success you haven't verified.
6. Version the API under /v1 from day one. Use UUID PKs and created_at/updated_at everywhere.

## Stack (do not deviate without asking)
- Web: Next.js 14 (App Router, TypeScript), Tailwind, shadcn/ui, TanStack Query,
  React Hook Form + Zod.
- API: FastAPI (Python), PostgreSQL via SQLAlchemy + Alembic, Pydantic schemas.
- Auth: Clerk (email + phone OTP + Google). API verifies the Clerk JWT in middleware.
- Payments: Razorpay, TEST MODE only. Authorize on offer-accept, capture on completion.
- Storage: Cloudflare R2 (S3-compatible) via presigned uploads.
- Email: Resend for transactional notifications.
- Hosting: Railway.

## Market / money
- Market: India. Currency: INR.
- Platform service fee: configurable %, default 15%, deducted at payment release.
- Escrow note: funds are AUTHORIZED on accept and CAPTURED on completion. We do not hold
  balances ourselves. Do not implement a custom wallet/ledger that holds customer money.

## Conventions
- Backend: snake_case, repository/service layer separation, Pydantic for all I/O schemas.
- Frontend: server components for data display, client components for interactivity.
  All API calls go through a typed api client + TanStack Query hooks. No fetch() scattered in components.
- Validation with Zod on the frontend and Pydantic on the backend — never trust the client.
- Every endpoint enforces auth + ownership rules. A user cannot offer on their own task,
  cannot accept more than one offer per task, cannot review before a task is completed.
- Write a short README section for each milestone explaining how to run/test it.

## Repo layout
/api    -> FastAPI service
/web    -> Next.js app
/CLAUDE.md
Keep them as separate apps that talk over HTTP.

## What is OUT of scope for Phase 1 (do NOT build)
Insurance, AI task-writing, automated disputes/refund workflows, advanced badges
(working-with-children, trade licenses, background checks), offer-expiry timers,
recurring tasks, business/team accounts, native mobile apps.
