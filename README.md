# Worthlane

A psychology-driven personal finance app built with Expo (React Native) and Next.js.

## Prerequisites

- [Postgres.app](https://postgresapp.com) (or any PostgreSQL 14+) must be running before starting the API
- Node.js 18+ and pnpm (`npm i -g pnpm`)
- Expo Go on your phone, or Xcode (iOS) / Android Studio (Android) for simulators

## First-time setup

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Copy and fill in API environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env - set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, SENTRY_DSN
# Plaid keys optional (sandbox) - needed only for bank linking

# 3. Set the mobile API URL
echo "EXPO_PUBLIC_API_URL=http://localhost:3001/api" > apps/mobile/.env.local
# Add EXPO_PUBLIC_SENTRY_DSN and the Sentry build env vars when you're ready
# to test crash reporting or upload release source maps.

# 4. Run database migrations
cd packages/db
DATABASE_URL="postgresql://<user>@localhost:5432/worthlane" npx prisma migrate deploy
cd ../..
```

## Starting the app

Two terminals are required and both must stay open.

**Terminal 1 - API server** (port 3001):
```bash
cd apps/api && pnpm dev
```

**Terminal 2 - Mobile app** (Metro bundler, port 8081):
```bash
cd apps/mobile && pnpm dev
```

In the Metro terminal press:
- `i` to open the iOS simulator
- `a` to open the Android emulator
- Scan the QR code with Expo Go on your phone

## Environment variables

### `apps/api/.env`
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 32+ char string for access tokens |
| `JWT_REFRESH_SECRET` | Random 32+ char string for refresh tokens |
| `PLAID_CLIENT_ID` | From [Plaid dashboard](https://dashboard.plaid.com) |
| `PLAID_SECRET` | Plaid sandbox secret |
| `PLAID_ENV` | `sandbox` (default) |
| `SENTRY_DSN` | Server DSN for Next.js API error reporting |
| `SENTRY_ENVIRONMENT` | Optional Sentry environment label |
| `SENTRY_AUTH_TOKEN` | Auth token used during builds to upload source maps |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug for the API |

### `apps/mobile/.env.local`
| Variable | Default |
|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001/api` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for the Expo app |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | `development` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for native symbol/source map upload |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug for the mobile app |
| `SENTRY_URL` | `https://sentry.io/` |

## Useful commands

```bash
pnpm typecheck       # type-check all packages
pnpm test            # run API unit tests (Vitest)
pnpm db:generate     # regenerate Prisma client after schema changes
pnpm db:migrate      # apply pending migrations
pnpm db:studio       # open Prisma Studio in browser
```

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Mobile | Expo 51 (React Native) |
| API | Next.js 14 (API routes only) |
| Database | PostgreSQL + Prisma 5 |
| Auth | JWT - access token 15m / refresh token 30d |
| Banking | Plaid (sandbox) |

## Features

- **Auth** - register, login, JWT refresh, biometric login (Face ID / Touch ID / Fingerprint)
- **Dashboard** - net worth, monthly income/spend, budgets, goals, streaks, nudges
- **Transactions** - list, paginate, impulse flag, manual entry
- **Budgets** - CRUD with loss-aversion messaging
- **Goals** - CRUD with progress tracking and projection
- **Plaid** - bank linking, account sync, transaction import
- **Nudge engine** - loss-aversion nudges for budget warnings, streak risk, goal milestones
- **Push notifications** - Expo Push + FCM/APNs; nudges delivered to device
- **Cron job** - daily proactive nudge delivery via `/api/cron/nudges`
- **Streaks** - daily check-in, on-budget, no-impulse tracking
