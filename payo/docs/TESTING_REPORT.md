# Payo – Testing Report

Version: Next.js + TypeScript + Tailwind CSS migration. Date of automated runs: 30 October 2026.
Environment: Node 22.23.4, npm 10.9.9, dependencies installed with `npm ci` from `package-lock.json`, headless Chromium 1.63 (Playwright).

**Statuses.** PASS = executed and matched the expectation. FAIL = executed and did not match. NOT TESTED = not executed here; the “How to test” notes explain the manual procedure.

**About the backend in these runs.** The automated browser tests use a **mocked Supabase backend** (`e2e/mock-supabase.js`): Playwright intercepts every request to `*.supabase.co` and answers with test data. This checks the application (pages, routing, calculations, the exact requests sent to Supabase) without touching the real database. It does **not** test the real database rules; those are listed under B as NOT TESTED.

---

## 0. Build and tooling

| Test case | Command | Expected result | Actual result | Status |
|---|---|---|---|---|
| Clean install | `npm ci` in an empty folder | installs from lockfile | 414 packages installed | PASS |
| Type check | `npm run typecheck` (`tsc --noEmit`, `strict: true`) | 0 errors | 0 errors | PASS |
| Lint | `npm run lint` (ESLint 9, `eslint-config-next` 16.4.3, max 0 warnings) | 0 errors, 0 warnings | 0 errors, 0 warnings | PASS |
| Unit tests | `npm test` (Vitest) | all pass | 3 files, 30 tests passed | PASS |
| Production build | `npm run build` (Next.js 16.4.3, Turbopack) | compiles, all routes generated | compiled; 22 routes (21 static + 1 dynamic `/client/groups/[groupId]`) | PASS |
| Dev server | `npm run dev`, open 15 pages in Chromium | no console errors or warnings, no error overlay | 0 errors on all 15 pages | PASS |
| Stack check | inspect `src/` and `package.json` | Next.js, TypeScript, Tailwind CSS; no CRA, no JS source | 62 `.ts/.tsx` files, 0 `.js/.jsx` in `src/`; one CSS file (`globals.css`, Tailwind); `react-scripts` and `react-router-dom` removed | PASS |
| Secrets | search source and build output for `service_role` | not present | not present | PASS |

## A. Functional testing

### A.1 Calculation logic (unit tests, `npm test`)

| Test case | Input | Expected result | Actual result | Status |
|---|---|---|---|---|
| Equal split, uneven | €100.00, 3 people | 33.34 / 33.33 / 33.33 | as expected | PASS |
| Extra cents follow order | 1001 cents, two orders | first two in order get 334 | as expected | PASS |
| Determinism | same input twice | identical | identical | PASS |
| Even split / one person / fewer cents than people | 9000÷3, 4999÷1, 2÷3 | 3000×3; 4999; 1/1/0 | as expected | PASS |
| Exhaustive conservation | totals 1–2000 cents × 1–12 people | sum = total, max−min ≤ 1 cent | holds for all 24 000 cases | PASS |
| Cents round-trip | 0…100 000 cents | `toCents(fromCents(c)) = c` | holds | PASS |
| Floating-point input | `toCents(0.1+0.2)`, `toCents(1.15)` | 30, 115 | 30, 115 | PASS |
| Amount parsing | `"12,5"`, `"12.345"`, `"-5"`, `"abc"` | 12.5, NaN, NaN, NaN | as expected | PASS |
| Net balances | A pays €90 for 3 | +60 / −30 / −30 | as expected | PASS |
| Settlement reduces debt | B pays A €30 | both 0 | as expected | PASS |
| Uneven split → balances | €100/3 paid by A | +66.66 / −33.33 / −33.33, sum 0 | as expected | PASS |
| Removed member keeps balance | split with former member | balance kept | kept | PASS |
| Random groups | 300 random groups | Σ net = 0; ≤ n−1 suggestions; settling all → 0 | holds | PASS |
| Monthly summary | `summary.test.ts` | totals, shares, categories, trend | passed | PASS |

### A.2 User flows in the browser (`npm run e2e`, mocked Supabase)

| Test case | Input | Expected result | Actual result | Status |
|---|---|---|---|---|
| Protected route, signed out | open /client/expenses without session | redirect to /login?from=/client/expenses | /login?from=%2Fclient%2Fexpenses | PASS |
| Login, wrong password | alex@example.com / wrong | error message, stays on /login | That email and password don’t match. Try again. / /login?from=%2Fclient%2Fexpenses | PASS |
| Login, valid credentials | alex@example.com / correct-password | redirect back to /client/expenses | /client/expenses | PASS |
| Logout | Settings -> Sign out | session removed, redirected to /login | /login?from=%2Fclient%2Fsettings | PASS |
| Admin route as normal user | role=user opens /admin/users | redirect to /client, no admin link in sidebar | /client, admin links: 0 | PASS |
| Admin route as admin | role=admin opens /admin/users | users table with 4 accounts | /admin/users, rows: 4 | PASS |
| Equal split €100.00 between 3 | amount 100, 3 members selected | preview “€33.33–€33.34 each”; shares 33.34/33.33/33.33; RPC splits sum to 10000 cents | preview “€33.33–€33.34 each”; shares €33.34 / €33.33 / €33.33; p_amount 100; splits [33.34,33.33,33.33] (sum 10000 cents) | PASS |
| Exact split validation | total 50, shares 20 + 20 | error “€10.00 still needs to be assigned.”, nothing sent | “€10.00 still needs to be assigned.”, requests sent: 0 | PASS |
| Group balances | open Flat group (mock data) | your balance +€1,478.46, 2 settle-up suggestions | balance “+€1,478.46”, suggestions 2 | PASS |
| Record payment (settle up) | click Settle on first suggestion, confirm | settlements insert with suggested amount | amount field 886.93; inserted {"from":"33333333","to":"11111111","amount":886.93} | PASS |
| Create group | name “Ski trip” | create_group RPC called, navigate to the new group | {"p_name":"Ski trip","p_description":""} -> /client/groups/aaaaaaaa-0000-4000-8000-00000000000n | PASS |
| Activity history + filter | open Activity, filter Payments | all events listed; filter shows 1 payment | all: 16, payments: 1 | PASS |
| PWA shortcut /client?add=expense | open URL | Add expense dialog opens, ?add removed from URL | dialogs: 1, url /client | PASS |
| Registration payload | name, email, password | signup sends only full_name as metadata (no role) | data: {"full_name":"New Person"} | PASS |

### A.3 Needs the real Supabase project

| Test case | How to test | Status |
|---|---|---|
| Registration creates a profile with role `user` | register in the app, then `select role from profiles where email = '…'` | NOT TESTED |
| E-mail confirmation and password reset e-mails | register / “Forgot password?” with a real inbox | NOT TESTED |
| Join group with invite code (second account) | second account in a private window enters the code | NOT TESTED |
| Data written correctly | after adding €100/3: `select * from expense_splits where expense_id = '…'` shows 33.34/33.33/33.33 | NOT TESTED |

## B. Security and RLS testing (needs the real Supabase project)

Use two normal accounts (U1, U2) in different groups and one admin (A). Run the queries in Supabase → SQL Editor with “Run as” the test user, or from a small script using `@supabase/supabase-js` with the anon key while signed in as that user.

| Test case | Input | Expected result | Actual result | Status |
|---|---|---|---|---|
| Normal user opens `/admin` (UI) | U1 visits `/admin/users` | redirected to `/client` | redirected (A.2, mocked) | PASS (UI only) |
| Read all profiles | U1: `select * from profiles` | own profile + people in shared groups | – | NOT TESTED |
| Read another group | U1: `select * from expenses where group_id = <U2's group>` | 0 rows | – | NOT TESTED |
| Insert expense directly | U1: `insert into expenses …` | permission denied | – | NOT TESTED |
| RPC into foreign group | U1: `rpc('create_expense', {p_group_id: <U2's group>, …})` | “You are not a member of this group” | – | NOT TESTED |
| Self-promotion | U1: `update profiles set role='admin' where id = auth.uid()` | “Only admins can change roles” | – | NOT TESTED |
| Admin changes own role | A demotes self | “You cannot change your own role” | – | NOT TESTED |
| Role in sign-up metadata | sign up with `data: { role: 'admin' }` via API | profile role `user` | app sends only `full_name` (A.2); trigger not tested | NOT TESTED |
| Live schema matches repo | run `supabase/verify_schema.sql` | 6 tables, no `user_roles`, RLS on, 13 policies | – | NOT TESTED |

## C. Usability and visual consistency

The new app was compared with the previous React/CRA version. Both were served locally with the **same mocked data and the same fonts**, and full-page screenshots were taken of 16 pages at two widths. The table shows the share of pixels that differ (threshold 40/255). Values under ~2% are anti-aliasing and sub-pixel text differences; the highest values come from slightly different native form-control rendering and 1–2 px line-wrapping differences.

| Page | Desktop 1366 px | Phone 390 px |
|---|---|---|
| activity | 0.2% | 0.1% |
| admin | 0.3% | 0.4% |
| admin-expenses | 2.6% | 3.2% |
| admin-groups | 0.5% | 0.7% |
| admin-users | 0.8% | 1.2% |
| client | 0.7% | 0.5% |
| expenses | 1.6% | 3.7% |
| group | 1.6% | 1.1% |
| groups | 0.8% | 1.7% |
| home | 0.2% | 1.7% |
| login | 0.4% | 1.2% |
| notfound | 0.0% | 0.0% |
| privacy | 1.4% | 4.6% |
| register | 0.8% | 2.7% |
| settings | 0.9% | 1.9% |
| summary | 0.5% | 2.0% |

| Test case | Input | Expected result | Actual result | Status |
|---|---|---|---|---|
| No horizontal scrolling | 16 pages at 390 px and 1366 px | page width = viewport | all screenshots exactly 390 / 1366 px wide | PASS |
| Same visual identity | colours, fonts, layout vs. previous version | unchanged | ≤ 4.6% pixel difference on all 32 screenshots (table above) | PASS |
| Tablet layout | 768 px | sidebar 220 px, single-column content | – | NOT TESTED |
| Usability with real users | 3–5 people: register → group → expense → settle | completed without help | – | NOT TESTED |

## D. PWA and offline testing (production build, `npm run build && npm start`)

| Test case | Input | Expected result | Actual result | Status |
|---|---|---|---|---|
| Manifest | GET /manifest.webmanifest | linked in <head>; name, start_url, standalone, 192/512 icons incl. maskable | link /manifest.webmanifest; Payo — Shared expenses; /client?source=pwa; standalone; icons 64x64 48x48 32x32 16x16, 192x192/any, 512x512/any, 192x192/maskable, 512x512/maskable | PASS |
| Service worker registration | load / in production build | sw.js active and controlling the page; not HTTP-cached | http://localhost:3100/sw.js; cache-control: no-cache, no-store, must-revalidate | PASS |
| Cache contents | after visiting /, /client, /client/groups | precached shell pages + visited pages; build JS/CSS; no Supabase URLs | pages: /, /login, /register, /forgot-password, /reset-password, /privacy, /terms, /client/expenses, /offline, /client/summary, /client/activity, /client/settings, /admin, /admin/users, /admin/groups, /admin/expenses, /client, /client/groups; static files: 34; any supabase: false | PASS |
| Offline reload / | offline, open / | interface loads from cache, offline banner shown | loaded; banner shown | PASS |
| Offline reload /login | offline, open /login | page loads from cache (signed-in test user is forwarded to /client), offline banner shown | loaded; banner shown | PASS |
| Offline reload /client | offline, open /client | layout loads from cache, offline banner shown; no data (not stored offline) | loaded; banner shown; data: not loaded, placeholders “—” shown | PASS |
| Offline, page never opened | offline, open /client/settings (precached at install) | settings page renders | settings rendered | PASS |
| Offline, group never opened | offline, open a group page not visited before | offline page explains the page is not available offline | You’re offline. | PASS |
| Reconnect | go online again | offline banner disappears | banner count 0 | PASS |
| Console errors | whole run | no uncaught page errors | none | PASS |

| Test case | How to test | Status |
|---|---|---|
| Install on desktop | Chrome/Edge → install icon in the address bar; app opens in its own window | NOT TESTED |
| Install on Android / iPhone | real device (iPhone: Share → Add to Home Screen) | NOT TESTED |
| Update banner | deploy a new build while the app is open → “A new version of Payo is ready” → Reload | NOT TESTED |
| Lighthouse | Chrome DevTools → Lighthouse → Progressive Web App | NOT TESTED |
