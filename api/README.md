# TaskMarket API

FastAPI service. All business logic lives here behind a versioned `/v1` JSON API.

## Stack
FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL (psycopg v3) · Clerk JWT verification (PyJWT).

## Run locally (M0)

```bash
# 0. Start Postgres (from repo root)
docker compose up -d

# 1. Create a virtualenv and install deps
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure env
cp .env.example .env
# .env ships with DEV_AUTH_BYPASS=true so you can hit /v1/me without a real Clerk token.

# 3. Run migrations
alembic upgrade head

# 4. Start the server
uvicorn app.main:app --reload
# -> http://localhost:8000   (interactive docs at /docs)
```

## Endpoints (M0)

| Method | Path         | Auth      | Description                                  |
| ------ | ------------ | --------- | -------------------------------------------- |
| GET    | `/v1/health` | none      | Liveness check → `{"status":"ok"}`           |
| GET    | `/v1/me`     | Clerk JWT | Returns the decoded user; upserts on first call |

### Test it

```bash
curl http://localhost:8000/v1/health
# {"status":"ok"}

# With DEV_AUTH_BYPASS=true (no token needed):
curl http://localhost:8000/v1/me
# {"id":"...","clerk_id":"dev_user","email":"dev@taskmarket.test", ...}

# With DEV_AUTH_BYPASS=false and no token → 401:
curl -i http://localhost:8000/v1/me
```

## Auth

`app/auth/clerk.py` exposes `get_current_user`, the dependency that protects endpoints:

- **`DEV_AUTH_BYPASS=true`** → returns a synthetic `dev_user` (local convenience only).
- **Otherwise** → verifies the `Authorization: Bearer <token>` against Clerk's JWKS
  (`CLERK_JWKS_URL`), checks the issuer, and returns the decoded claims. Missing/invalid
  tokens get a `401`.

To test the real path, set your Clerk values in `.env`, flip `DEV_AUTH_BYPASS=false`, and
send a Clerk session token from the web app.

## Layout

```
app/
  config.py        # env-driven settings
  db.py            # engine, session, Base, get_db dependency
  models/          # SQLAlchemy models (User for M0)
  schemas/         # Pydantic I/O schemas
  auth/clerk.py    # Clerk JWT verification + dev bypass
  services/        # business logic (user upsert)
  routers/         # /v1 endpoints (health, me)
  main.py          # app factory, CORS, router mounting
alembic/           # migrations
```
