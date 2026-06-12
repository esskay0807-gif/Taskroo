# TaskMarket Web

Next.js 14 (App Router, TypeScript) client for the TaskMarket API. The frontend is a thin
client — all business logic lives in the [`/api`](../api) service.

## Stack
Next.js 14 · Tailwind · shadcn/ui · TanStack Query · Clerk.

> Note: Clerk is pinned to **v6** because v7 requires Next.js 15+, and the project targets
> Next.js 14 (per `CLAUDE.md`).

## Run locally (M0)

```bash
npm install

cp .env.example .env.local
# Fill in your Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY).
# NEXT_PUBLIC_API_BASE_URL defaults to http://localhost:8000.

npm run dev
# -> http://localhost:3000
```

The API must be running too (see [`../api/README.md`](../api/README.md)).

## What the landing page does
- **Signed out:** shows Sign in / Sign up buttons (Clerk modal).
- **Signed in:** the `<MeCard>` component calls `GET /v1/me` (via the typed client in
  `lib/api.ts`, attaching the Clerk session token) and renders the decoded user.

A full signed-in round-trip requires real Clerk keys. Without them the page still builds and
renders; the signed-out state is shown.

## Layout
```
app/
  layout.tsx     # ClerkProvider > Providers (TanStack Query)
  providers.tsx  # QueryClientProvider (client component)
  page.tsx       # landing: auth buttons + <MeCard/>
components/
  me-card.tsx    # fetches /v1/me
  ui/            # shadcn components
lib/
  api.ts         # typed API client
  utils.ts       # shadcn cn()
middleware.ts    # clerkMiddleware()
```
