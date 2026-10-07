# Symptom Tracker

A multi-user web app for daily symptom tracking. Users sign in with email/password (Google sign-in available once configured), log timestamped check-ins with per-symptom severity ratings, and browse history by year → month → day.

## Status

Complete: backend, auth, and the mobile-first UI (login, daily check-in dashboard, history with year → month → day drill-down and trend chart).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) — single codebase for UI + API
- [Auth.js v5 (next-auth)](https://authjs.dev) — credentials + Google providers, JWT sessions
- [Prisma 7](https://www.prisma.io) + PostgreSQL — ORM and database
- Tailwind CSS 4, Zod 4 (validation), bcryptjs (password hashing)

## Prerequisites

- Node.js 20.9+
- PostgreSQL running locally (this project was set up against Homebrew's `postgresql@15`)

## Setup

```bash
npm install

# create the database (once)
createdb symptom_tracker

# environment file (already present in local dev — recreate if missing)
# see ".env" section below

# apply migrations and generate the client
npm run db:migrate

npm run dev
```

Open http://localhost:3000.

### .env

```bash
DATABASE_URL="postgresql://<user>@localhost:5432/symptom_tracker"
AUTH_SECRET="<openssl rand -base64 32>"

# Google OAuth — leave empty until configured (see below)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# IANA timezone for grouping entries into local days; empty = server timezone
APP_TIMEZONE=""
```

`.env` is gitignored. Never commit it.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build (type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio (browse data) |

## Data model

- **User** — Auth.js standard fields plus `passwordHash` (null for Google-only accounts)
- **Entry** — one check-in: `userId`, `createdAt` (timestamp, required, editable), optional `note`
- **Symptom** — belongs to an Entry: `name` + `severity` (1–10). Multiple entries per day are expected.

Day grouping uses `APP_TIMEZONE` (or the server timezone) so late-evening check-ins stay on the correct calendar day regardless of UTC storage.

## Auth

- **Email/password** — register (`POST /api/register` or the `registerAction` server action) hashes with bcrypt (12 rounds); login via Auth.js credentials provider.
- **Google** — configured but disabled until credentials are added (see below). When enabled, `allowDangerousEmailAccountLinking` lets one email use both methods.
- **Session** — JWT strategy; `session.user.id` is available anywhere on the server via `auth()` from `@/auth`.
- **Route protection** — `src/proxy.ts` redirects unauthenticated visitors to `/login` and signed-in users away from `/login`. `src/auth.config.ts` holds the proxy-safe config (no database); `src/auth.ts` is the full config.

### Enabling Google sign-in later

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → create an **OAuth 2.0 Client ID** (type: Web application).
2. Authorized JavaScript origins: `http://localhost:3000`
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Client Secret into `.env`:
   ```bash
   AUTH_GOOGLE_ID="...apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="..."
   ```
5. Restart the dev server. The Google provider is added automatically when both values are set (`googleSignInEnabled` in `src/auth.ts`).

For a later production deploy, add your domain as an origin/redirect URI in the same Google client.

## API

All endpoints except `POST /api/register` require a session (Auth.js cookie) and return `401` otherwise. All data is scoped to the signed-in user — cross-user access returns `404`.

### Auth (Auth.js)

`/api/auth/*` — `csrf`, `session`, `signin`, `callback/credentials`, `callback/google`, `signout`.

### Register

```
POST /api/register
{ "email": "a@b.com", "password": "min8chars", "name": "Optional" }
→ 201 { user } | 400 validation | 409 email taken
```

### Entries

```
GET    /api/entries?year=2026&month=10&day=6   → { entries }   (filters optional: none | year | year+month | year+month+day)
POST   /api/entries                            → 201 { entry }
GET    /api/entries/:id                        → { entry }
PATCH  /api/entries/:id                        → { entry }     (partial update; symptoms array replaces all)
DELETE /api/entries/:id                        → { ok: true }
```

Entry body:

```json
{
  "createdAt": "2026-10-06T09:30:00.000Z",
  "note": "optional, max 2000 chars",
  "symptoms": [{ "name": "Headache", "severity": 6 }]
}
```

Validation: severity 1–10 int, 1–50 symptoms, timestamps between 2000-01-01 and now (+5 min clock skew).

### History (drill-down)

```
GET /api/history/years                        → { years: [{ year, count }] }
GET /api/history/months?year=2026             → { year, months: [{ month, count }] }
GET /api/history/days?year=2026&month=10      → { year, month, days: [{ day, count }] }
GET /api/history/trend?year=2026&month=10     → { year, month, series: [{ name, points: [{ date, average, count }] }] }
```

The `trend` endpoint powers the per-symptom severity chart (daily average per symptom).

### Server actions

For use in future forms (already implemented for auth):

- `registerAction(prevState, formData)` / `loginAction(prevState, formData)` — return `{ error? }`, designed for `useActionState`
- `googleLoginAction()` — starts the Google flow
- `logoutAction()` — signs out and redirects to `/login`
- `createEntryAction(prevState, formData)` / `deleteEntryAction(formData)` — check-in mutations with `revalidatePath`

## Frontend (mobile-first)

- **`/login`** — sign in / create account toggle, Google button (disabled until configured)
- **`/dashboard`** — "New check-in" form (dynamic symptom rows, 1–10 severity sliders, optional note, editable time defaulting to now; previous symptom names autocomplete) + today's entries with severity bars and delete
- **`/history`** — drill-down: years → months → month view (trend chart + calendar) → day entries
- Fixed bottom tab bar (Today / History), max-width mobile shell centered on desktop, safe-area aware
- Shared presentational components: `entry-card`, `trend-chart` (Recharts), `check-in-form`, `bottom-nav`

## Project structure

```
prisma/schema.prisma        Data model
prisma7.config.ts           Prisma CLI config (loads .env)
src/auth.config.ts          Proxy-safe Auth.js config (pages, route protection)
src/auth.ts                 Full Auth.js config (providers, adapter, JWT callbacks)
src/proxy.ts                Route protection (Next 16's middleware)
src/lib/db.ts               Prisma client singleton (pg driver adapter)
src/lib/entries.ts          Entry CRUD + history/trend queries
src/lib/users.ts            Registration, credential verification
src/lib/validation.ts       Zod schemas (shared by API + actions)
src/lib/time.ts             Timezone-aware day grouping helpers
src/lib/session.ts          currentUserId() helper
src/lib/http.ts             JSON error helpers
src/app/actions/          Server actions (auth + entries)
src/app/api/              REST routes (register, entries, history, auth)
src/app/login, (app)/     Pages (login, dashboard, history)
src/components/           UI components (forms, cards, nav, chart)
src/generated/prisma/     Generated Prisma client (gitignored)
```

## Deploying later (Vercel + Neon)

Nothing in the code blocks deployment; the steps will be:

1. Push to GitHub, import into Vercel.
2. Create a Postgres database (e.g. [Neon](https://neon.tech)) and set `DATABASE_URL` in Vercel env vars.
3. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (add the production URL to the Google client's origins/redirect URIs).
4. Set `APP_TIMEZONE` (server TZ on Vercel is UTC).
5. Run `npx prisma migrate deploy` once against the new database.
# symtom-tracker
