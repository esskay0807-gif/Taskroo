# Claude Code Build Pack — TaskMarket Phase 1

Two parts:
1. **`CLAUDE.md`** — drop this in your repo root. Claude Code reads it automatically on every turn, so you never re-explain the stack or rules.
2. **Milestone prompts (M0–M7)** — paste one at a time. Run `/clear` between milestones to keep the context window clean.

---

# PART 1 — Put this in `CLAUDE.md` at the repo root

```markdown
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
```

---

# PART 2 — Milestone prompts (paste one at a time)

## M0 — Scaffold

```
Read CLAUDE.md. We're starting M0: scaffold only — no features yet.

Set up:
1. /api — a FastAPI app with: settings via env vars, SQLAlchemy + a Postgres connection,
   Alembic initialized, a /v1/health endpoint, and Clerk JWT verification middleware with
   a protected GET /v1/me that returns the decoded user (upsert a User row on first call).
2. /web — a Next.js 14 App Router + TypeScript app with Tailwind, shadcn/ui initialized,
   TanStack Query provider, Clerk provider, and a typed API client pointed at the FastAPI base URL.
   Add a landing page that calls /v1/me when signed in.
3. A docker-compose for local Postgres, and .env.example files for both apps.
4. Brief README run instructions for both apps.

Plan the file tree first and show it to me. Then build. Stop after M0 — confirm both apps
boot locally and /v1/health and /v1/me work before we continue.
```

## M1 — Profiles & roles

```
Read CLAUDE.md. M1: profiles and roles.

- User model already exists from Clerk upsert. Add fields: name, avatar_url, bio, city,
  lat, lng, is_poster, is_tasker, phone_verified, id_verified, rating_avg, rating_count,
  completion_rate.
- API: PATCH /v1/me (edit profile), GET /v1/users/{id} (public profile),
  POST /v1/uploads/presign (presigned R2 URL for avatars).
- Web: /settings page to edit profile + upload avatar; /profile/[id] public profile page
  showing name, bio, badges placeholder, rating/completion-rate placeholders.
- Add a role toggle so one account can act as Poster or Tasker (store both flags).

Migrations via Alembic. Confirm I can edit my profile and view a public profile. Stop after M1.
```

## M2 — Tasks

```
Read CLAUDE.md. M2: tasks (post + browse).

- Models: Category (seed ~12 realistic categories), Task, TaskPhoto. Task statuses:
  draft | open | assigned | in_progress | completed | cancelled.
- API: GET /v1/categories; POST /v1/tasks; GET /v1/tasks (browse with filters: category,
  location_type, city, budget range, search q, sort); GET /v1/tasks/{id};
  PATCH /v1/tasks/{id} (poster only, while open); POST /v1/tasks/{id}/cancel.
- Web: /post multi-step form (details → location → budget → photos → review),
  /browse feed with filters + search, /tasks/[id] detail page.
- Enforce: only the poster can edit/cancel; new tasks default to status=open.

Stop after M2. Confirm I can post a task and find it via browse + filters.
```

## M3 — Offers

```
Read CLAUDE.md. M3: offers.

- Model: Offer (task_id, tasker_id, amount, message, status: pending|accepted|rejected|withdrawn).
- API: POST /v1/tasks/{id}/offers; GET /v1/tasks/{id}/offers (poster only);
  POST /v1/offers/{id}/accept; POST /v1/offers/{id}/withdraw.
- Rules: a user cannot offer on their own task; only one offer can be accepted per task;
  accepting an offer sets Task.status=assigned, sets assigned_tasker_id + agreed_amount,
  and auto-rejects all other pending offers. (Payment comes in M5 — for now just the status change.)
- Web: make-offer panel on /tasks/[id]; offers list for the poster; "My Jobs & Offers" section
  on /dashboard for taskers and "My Tasks" for posters.

Stop after M3. Confirm the accept flow transitions states correctly.
```

## M4 — Messaging

```
Read CLAUDE.md. M4: messaging tied to a task.

- Models: Conversation (one per task, poster + tasker), Message.
- Create a Conversation when a tasker makes an offer.
- API: GET /v1/conversations; GET /v1/conversations/{id}/messages;
  POST /v1/conversations/{id}/messages. Mark read on fetch.
- Web: /messages list and /messages/[conversationId] thread. Use TanStack Query polling
  (every few seconds) for now — no WebSockets yet.

Stop after M4. Confirm two test accounts can message about a task.
```

## M5 — Payments (Razorpay, test mode)

```
Read CLAUDE.md. M5: payments. TEST MODE ONLY.

- Model: Payment (task_id, payer_id, payee_id, amount, currency, status:
  authorized|held|released|refunded|failed, provider=razorpay, provider_order_id, provider_payment_id).
- Flow: when a poster accepts an offer, create a Razorpay order to AUTHORIZE agreed_amount.
  On successful authorization, Payment.status=held and Task stays assigned.
  POST /v1/tasks/{id}/complete (poster confirms) → CAPTURE payment, deduct the 15% service fee,
  mark Payment.released, Task.completed.
- API: POST /v1/payments/checkout; POST /v1/webhooks/razorpay (verify signature, update status).
- Web: Razorpay checkout on offer-accept; "Confirm completion & release payment" action for the poster.
  Show the service fee transparently.
- Do NOT build a custom wallet/ledger. Use authorize/capture only.

Stop after M5. Walk me through testing a full hold → release in Razorpay test mode.
```

## M6 — Reviews & trust signals

```
Read CLAUDE.md. M6: reviews and trust.

- Models: Review (task_id, reviewer_id, reviewee_id, role: of_tasker|of_poster, rating 1-5,
  comment), ReviewPhoto.
- Rules: reviews only allowed after Task.status=completed; both parties can review each other once.
- After a review, recompute the reviewee's rating_avg, rating_count, and completion_rate
  (completion_rate = completed / last 20 relevant tasks, excluding poster-caused cancellations).
- API: POST /v1/tasks/{id}/reviews; GET /v1/users/{id}/reviews.
- Web: review form (stars + comment + optional photo) after completion; show rating,
  completion rate, badges, and review history on /profile/[id] and wherever a tasker is listed.

Stop after M6. Confirm ratings recompute correctly.
```

## M7 — Notifications & polish

```
Read CLAUDE.md. M7: notifications and production polish.

- Model: Notification (user_id, type, payload jsonb, read_at).
- Trigger in-app + email (Resend) notifications for: offer received, offer accepted,
  new message, task completed.
- API: GET /v1/notifications; POST /v1/notifications/{id}/read.
- Web: notification bell + list.
- Polish pass: empty states, loading skeletons, error boundaries, basic rate-limiting on
  write endpoints, and a final check that every endpoint enforces auth + ownership.

Definition of done for Phase 1: two test accounts (one poster, one tasker) complete the
ENTIRE loop end to end — post → offer → accept → pay (held) → chat → complete → release →
review — in Razorpay test mode. Verify this yourself and report the result.
```

---

# PART 3 — Tips for running this with Claude Code

- **Start each milestone fresh.** Run `/clear` before pasting the next milestone prompt — `CLAUDE.md` reloads automatically, so context stays clean without losing the rules.
- **Make it plan first.** If it starts coding a big change immediately, stop it and say "show me the plan first." Catching a wrong approach in the plan is far cheaper than after 15 files.
- **Hold it to verification.** If it says "done," ask "did you run it? paste the output." Milestone M5 especially — make it actually hit Razorpay test mode.
- **Commit per milestone.** `git commit` after each green milestone so you can roll back if a later one goes sideways.
- **When it drifts out of scope**, point it back at the "OUT of scope" list in `CLAUDE.md` — that list is your main defense against the build ballooning.
- **Keep secrets in env.** Never let it hardcode Clerk/Razorpay/R2 keys; they belong in `.env` (which `.env.example` documents).
```
