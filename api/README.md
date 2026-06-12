# TaskMarket API

FastAPI service. All business logic lives here behind a versioned `/v1` JSON API; the web app
is one client, and a future mobile app will be a second client of the same API.

## Stack

FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL (psycopg v3) · Pydantic v2 · PyJWT (Clerk) ·
boto3 (R2) · httpx (Razorpay/Resend). Money is whole INR; Razorpay is called in paise.

## Run locally

```bash
# 0. Start Postgres (from repo root)
docker compose up -d

# 1. venv + deps
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. env — ships with DEV_AUTH_BYPASS=true and all integrations unset (dev fallbacks active)
cp .env.example .env

# 3. migrate + run
alembic upgrade head
uvicorn app.main:app --reload
# -> http://localhost:8000   (interactive docs at /docs)
```

## Auth & local testing without Clerk

`app/auth/clerk.py` exposes `get_current_user`:

- **`DEV_AUTH_BYPASS=true`** (default in `.env`) → no token required; the request is treated as a
  synthetic user. The optional **`X-Dev-User`** header picks the identity (defaults to
  `dev_user`), so you can simulate a poster vs. a tasker:

  ```bash
  curl -H "X-Dev-User: alice" -X POST localhost:8000/v1/tasks -H 'Content-Type: application/json' \
    -d '{"title":"Deep clean","description":"2BHK","category_id":"<id>","location_type":"remote","budget_min":1000,"budget_max":2000}'
  ```

- **`DEV_AUTH_BYPASS=false`** → verifies the `Authorization: Bearer <token>` against Clerk's JWKS
  (`CLERK_JWKS_URL`), checks the issuer, returns the decoded claims; missing/invalid → `401`.

> `X-Dev-User` and the upload/payment dev fallbacks are **local conveniences only** — never
> enable `DEV_AUTH_BYPASS` in production.

## Endpoints (`/v1`)

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET  | `/health` | — | Liveness |
| GET  | `/me` | yes | Decoded user; upserts on first call |
| PATCH| `/me` | yes | Edit own profile |
| GET  | `/me/tasks` | yes | Tasks I posted |
| GET  | `/me/offers` | yes | Offers I made |
| GET  | `/users/{id}` | — | Public profile (no email/coords) |
| GET  | `/users/{id}/reviews` | — | A user's reviews |
| POST | `/uploads/presign` | yes | Presigned upload URL (R2 or dev) — `kind`: avatar/task/review |
| GET  | `/categories` | — | Seeded task categories |
| POST | `/tasks` | yes | Post a task (poster = caller) |
| GET  | `/tasks` | — | Browse: filters `category, location_type, city, budget_min/max, q, sort`, paged |
| GET  | `/tasks/{id}` | — | Task detail |
| PATCH| `/tasks/{id}` | poster | Edit while `open` (409 otherwise) |
| POST | `/tasks/{id}/cancel` | poster | Cancel |
| POST | `/tasks/{id}/complete` | poster | Capture payment, deduct fee, release, complete |
| POST | `/tasks/{id}/offers` | yes | Make an offer (not own task, one pending each) |
| GET  | `/tasks/{id}/offers` | poster | Offers on the task |
| POST | `/offers/{id}/accept` | poster | Assign task, auto-reject other pending offers |
| POST | `/offers/{id}/withdraw` | owner | Withdraw own pending offer |
| GET  | `/conversations` | yes | My threads (other user, last message, unread count) |
| GET  | `/conversations/{id}/messages` | participant | Marks read on fetch |
| POST | `/conversations/{id}/messages` | participant | Send a message |
| POST | `/payments/checkout` | poster | Create Razorpay order / hold (dev → held) |
| POST | `/payments/verify` | poster | Razorpay checkout handshake → held |
| POST | `/webhooks/razorpay` | signature | `payment.authorized/captured/failed` |
| GET  | `/tasks/{id}/payment` | participant | Payment status + fee/net |
| POST | `/tasks/{id}/reviews` | participant | After completion, once per reviewer |
| GET  | `/tasks/{id}/reviews` | — | The task's reviews |
| GET  | `/notifications` | yes | My notifications + unread count |
| POST | `/notifications/{id}/read` | owner | Mark read |

"poster/owner/participant" = the route enforces that ownership in addition to auth.

## Integrations & dev fallbacks

Every integration has a fallback so the app runs without external keys. Set the keys to switch
to the real provider.

| Integration | Env | Without keys (dev) | With keys (real) |
| ----------- | --- | ------------------ | ---------------- |
| **Clerk** (auth) | `CLERK_JWKS_URL`, `CLERK_ISSUER`, `DEV_AUTH_BYPASS` | bypass + `X-Dev-User` | JWKS verification |
| **Cloudflare R2** (uploads) | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | local `PUT/GET /v1/uploads/dev/...` | presigned R2 PUT |
| **Razorpay** (payments) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | checkout simulates authorize→held | real order + capture + webhook |
| **Resend** (email) | `RESEND_API_KEY`, `RESEND_FROM` | emails logged to console | emails sent |

Other settings: `DATABASE_URL`, `CORS_ORIGINS`, `API_BASE_URL` (used to build dev upload URLs —
keep it matched to the port you run on), `SERVICE_FEE_PERCENT` (default 15),
`RATE_LIMIT_PER_MINUTE` (default 120).

### Payments (Razorpay test mode)

Escrow via authorize → capture, no custom wallet/ledger. On `checkout` the agreed amount is
authorized and **held**; on `complete` it is **captured**, the `SERVICE_FEE_PERCENT` is deducted
(`fee_amount`/`net_amount` stored on the Payment), and the rest is released to the tasker.

Real walkthrough: set `RAZORPAY_KEY_ID`/`KEY_SECRET` (test mode) + real Clerk keys, post → offer
→ accept in the browser, click **Pay & authorize** (opens the Razorpay widget; test card
`4111 1111 1111 1111`, any future expiry/CVV) → **held**, then **Confirm completion** → captured
→ **released**. Localhost can't receive webhooks directly; the client handshake (`/payments/verify`)
covers it, or tunnel `/v1/webhooks/razorpay` (e.g. ngrok) and register it in the Razorpay dashboard.

## Rate limiting

`app/rate_limit.py` is a pure-ASGI in-memory fixed-window limiter on write methods
(`POST/PATCH/PUT/DELETE`), keyed by identity (`X-Dev-User` → bearer hash → IP). Webhooks are
exempt; exceeding the limit returns `429`. Single-instance only — back it with Redis to scale.

## Migrations

```bash
alembic upgrade head      # apply
alembic downgrade -1      # roll back one
```

`0001` users · `0002` profile fields · `0003` tasks (+ seeds ~12 categories) · `0004` offers ·
`0005` messaging (backfills conversations) · `0006` payments · `0007` reviews · `0008` notifications.

## Layout

```
app/
  config.py          # env-driven settings (+ *_configured helpers)
  db.py              # engine, session, Base, get_db
  rate_limit.py      # write rate-limit ASGI middleware
  auth/clerk.py      # Clerk JWT verification + dev bypass / X-Dev-User
  models/            # SQLAlchemy models + enums.py
  schemas/           # Pydantic I/O schemas
  services/          # business logic (user, task, offer, conversation, payment,
                     #   review, stats, notification, storage, razorpay, email)
  routers/           # /v1 endpoints, one module per resource
  main.py            # app factory, CORS, rate limiter, router mounting
alembic/             # migrations
```
