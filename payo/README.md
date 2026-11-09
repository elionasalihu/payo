# Payo

**Development of a PWA Application for Managing and Splitting Shared Expenses**

Payo is a web app for splitting shared expenses between friends, flatmates, family or any small group. You create a group, add the people in it, add expenses, and Payo calculates who owes whom and suggests how to settle up. It can be installed on a phone or computer as an app (PWA).

## Technologies

| Technology | Version | Used for |
|---|---|---|
| Next.js (App Router) | 16.4.3 | routing, layouts, build, prerendering, metadata, manifest, fonts |
| React | 19.3.0 | user interface (Client Components with hooks) |
| TypeScript | 5.9.3 | all source code (`strict` mode) |
| Tailwind CSS | 4.3.3 | styling; design tokens in `src/app/globals.css` |
| Supabase (`@supabase/supabase-js`) | 2.118.0 | authentication + PostgreSQL database with Row Level Security |
| Lucide React | 1.65.0 | icons |
| Motion | 14.9.0 | animations |
| Vitest / Playwright | 5.0.5 / 1.63.0 | unit tests / browser tests |

Documentation: [`docs/TECHNICAL_DOCUMENTATION.md`](docs/TECHNICAL_DOCUMENTATION.md) (architecture, database/ERD, security, algorithms, data flow, PWA) · [`docs/TESTING_REPORT.md`](docs/TESTING_REPORT.md) · [`docs/MIGRATION_REPORT.md`](docs/MIGRATION_REPORT.md).

## Features

- Register, log in, log out, forgot/reset password, change name and password
- Groups with members, invite code, add member by e-mail, leave, edit and delete group
- Expenses with category, date, payer, equal or exact split (calculated in integer cents)
- Balances per group and overall (you owe / you are owed)
- Settle-up suggestions and **recording** payments made outside the app (Payo does not move money)
- Activity history and monthly summary (by category, by group, last 6 months)
- Admin panel (users, groups, expenses, role management)
- Installable PWA; the interface opens offline (data needs a connection)
- Responsive layout for phone, tablet and desktop

## Requirements

- Node.js **20.9 or newer** (`node -v`) and npm
- A Supabase project (the hosted one used by Payo, or your own)

## Setup

```bash
npm install
cp .env.example .env.local     # then fill in the two values
npm run dev                    # http://localhost:3000
```

`.env.local` (values from Supabase → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Only the public **anon** key goes here; never the `service_role` key. `.env.local` is excluded from Git.

An existing `.env` from the previous version (`REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY`) also works: `next.config.ts` uses those names as a fallback. Restart `npm run dev` (or rebuild) after changing any of these values.

### Supabase (own project)

1. Create a project on supabase.com.
2. SQL Editor → New query → paste `supabase/schema.sql` → Run (tables, triggers, RLS policies, functions).
3. Put the URL and anon key in `.env.local`.
4. Optional: Authentication → Providers → Email → “Confirm email”.
5. Make an account admin after registering it:

   ```sql
   update public.profiles set role = 'admin' where email = 'your@email.com';
   ```

`supabase/verify_schema.sql` contains read-only queries to check that a database matches `schema.sql`. Run it in the SQL Editor of the real project to confirm the live database; `npm run test:rls` checks the schema and its policies locally, but not the live project.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm start` | runs the production build (needed for the PWA/service worker) |
| `npm test` | unit tests (money, splitting, balances, monthly summary) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run e2e` | browser tests with a mocked Supabase backend (see `e2e/`) |
| `npm run test:rls` | 18 database security tests (RLS, roles, RPC functions) on `supabase/schema.sql`, run in PostgreSQL (PGlite); needs no Supabase account |

## PWA and offline

The service worker (`public/sw.js`) is registered only in the production build:

```bash
npm run build
npm start
```

Chrome/Edge show an install icon in the address bar; on iPhone use Share → Add to Home Screen.

**Offline:** after one online visit, every page's interface opens without a connection and an offline banner is shown. Data is not stored offline: loading groups, adding or changing expenses and recording payments need a connection. Nothing is queued, so there is nothing to synchronise later.

## Accounts and roles

- New accounts always get the role `user` (`profiles.role`); sign-up sends only the name.
- Admins (`role = 'admin'`) can open `/admin`. Others are redirected, and the database (RLS + the `protect_profile_role` trigger) blocks non-admins from reading other users' data or changing roles.
- In a group, the creator is the `owner` (edit/delete group, remove members); others are `member`.

## Project structure

```
src/
  app/                 Next.js routes (page.tsx per URL), layouts, manifest, globals.css, fonts
  components/          providers, auth, dashboard, admin, landing, layout, pwa, ui
  lib/                 TypeScript types, money/balance/summary logic + tests, Supabase client and API
public/                service worker (sw.js) and icons
supabase/              schema.sql, verify_schema.sql, tests/rls.test.mjs (database security tests)
e2e/                   Playwright browser tests + mocked Supabase backend
docs/                  technical documentation, testing report, migration report, diagrams
```
