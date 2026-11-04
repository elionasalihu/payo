# Payo – Migration Report: React (CRA) + JavaScript + CSS → Next.js + TypeScript + Tailwind CSS

Date: 30 October 2026. Input: the audited Payo project (Create React App, JavaScript, plain CSS, Supabase).
Result: the same application rebuilt on **Next.js 16.4 (App Router), TypeScript 5.9 (strict) and Tailwind CSS 4.3**, with the same Supabase database, features and design.

Related: [`TECHNICAL_DOCUMENTATION.md`](TECHNICAL_DOCUMENTATION.md) · [`TESTING_REPORT.md`](TESTING_REPORT.md).

---

## 1. Summary

| | Before | After |
|---|---|---|
| Framework / build | Create React App 5 (`react-scripts`, webpack) | Next.js 16.4.3 (App Router, Turbopack) |
| Routing | React Router 7 (`App.js`) | file-based routes in `src/app/**/page.tsx` + layouts |
| Language | JavaScript (49 files) | TypeScript, `strict` (62 files, 0 JavaScript files in `src/`) |
| Styling | 12 CSS files, ~5 400 lines | Tailwind CSS utilities; one CSS file (`globals.css`, 86 lines: theme tokens, base, keyframes) |
| Fonts | Google Fonts `<link>` | self-hosted with `next/font/local` (also work offline) |
| Manifest | `public/manifest.json` | `src/app/manifest.ts` |
| Service worker | Workbox, compiled by CRA | `public/sw.js` (plain JavaScript, no extra dependency) |
| Env variables | `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Unit tests | Jest via react-scripts | Vitest (same 30 tests) |
| Browser tests | none | Playwright + mocked Supabase (`e2e/`, 24 checks) |
| Lint | `eslint-config-react-app` | `eslint-config-next` 16 (core-web-vitals + TypeScript) |
| Database | `supabase/schema.sql` | **unchanged** |

**Unchanged:** database schema, RLS policies, RPC functions, every feature and route URL, the splitting and balance algorithms, texts, colours (#20b86b, #159456, #eaf8f0, #f8f9f7, #111827, #667085), fonts and layout.

## 2. Verification (details in TESTING_REPORT.md)

| Check | Result |
|---|---|
| `npm ci` (clean folder) → `npm run build` | PASS: 22 routes |
| `npm run typecheck` / `npm run lint` | 0 errors / 0 errors, 0 warnings |
| `npm test` | 30/30 |
| `npm run e2e` (mocked Supabase) | 24/24: auth redirects, login errors, logout, admin protection, €100/3 split payload, validation, balances, settle up, create group, activity, PWA shortcut, registration payload, manifest, service worker, cache contents, offline reloads, reconnect, no console errors |
| `npm run dev`, 15 pages | 0 console errors or warnings |
| Visual comparison with the previous version (same data, same fonts, 16 pages × 2 widths) | 0.0–4.6% pixel difference; no horizontal scrolling. Side-by-side examples in `docs/comparison/` |
| Real Supabase project (RLS, e-mails, real devices) | NOT TESTED; procedures in TESTING_REPORT.md |

## 3. Design decisions

1. **App Router routes instead of React Router.** The official CRA → Next.js guide's quickest path keeps React Router inside one catch-all page. That would still be a React Router app, so every route was moved to its own `page.tsx`, with `layout.tsx` files for the client and admin areas.
2. **Client Components.** Payo's data belongs to the signed-in user and is protected by RLS, and the session lives in the browser (`localStorage`). All interactive pages are therefore Client Components that call Supabase from the browser, exactly as before. Static pages (privacy, terms, offline, 404) are Server Components. No server-side code was added: no Server Actions, Route Handlers or middleware.
3. **`cacheComponents` / `partialPrefetching` turned off.** The create-next-app template enables them. They optimise server-rendered data, which Payo doesn't have, and in development they raised "instant navigation" validation errors. Both are off (`next.config.ts`).
4. **Tailwind conversion matched to what actually rendered.** CRA put every CSS file into one global bundle, so some rules from one page affected others. For example, `Home.css` set the body font to Plus Jakarta Sans for the whole app, and `Admin.css` made the summary chart 260 px instead of 230 px. The Tailwind version reproduces the rendered result, measured in the browser, not only what each file says.
5. **Self-hosted fonts.** Same four fonts, loaded with `next/font/local` from `src/app/fonts` (SIL Open Font License). This removes the Google Fonts request and makes the offline interface look correct.
6. **Hand-written service worker** (`public/sw.js`, ~130 lines), easy to explain and with no extra dependency. At install it precaches every static route and the JS/CSS files those pages reference.
7. **Shared class sets** (`src/components/ui/classes.ts`): buttons, inputs, panels and badges are defined once and reused. Button size and colour are separate (`btn.*`, `btnSm.*`) so classes never conflict.
8. **One lint rule turned off:** `react-hooks/set-state-in-effect`. Payo resets modal forms when they open and sets `loading` before fetching, which is intentional. The reason is written in `eslint.config.mjs`.

## 4. File mapping (old → new)

| Old (CRA) | New (Next.js) |
|---|---|
| `public/index.html`, `src/index.js`, `src/App.js` | `src/app/layout.tsx`, `src/app/providers.tsx`, route folders in `src/app/` |
| `src/index.css`, `components/styles/**/*.css`, `pwa/Pwa.css` | `src/app/globals.css` + Tailwind classes in each component; `src/components/ui/classes.ts` |
| `auth/AuthProvider.js`, `auth/RouteGuards.js` | `components/providers/AuthProvider.tsx`, `components/auth/RouteGuards.tsx` |
| `components/supabase/client.js`, `api.js` | `lib/supabase/client.ts`, `lib/supabase/api.ts` (+ `lib/types.ts`) |
| `lib/*.js`, `lib/*.test.js` | `lib/*.ts`, `lib/*.test.ts` |
| `pwa/PwaProvider.js`, `PwaUI.js`, `serviceWorkerRegistration.js`, `service-worker.js` | `components/providers/PwaProvider.tsx`, `components/pwa/PwaUI.tsx`, `public/sw.js` |
| `public/manifest.json` | `src/app/manifest.ts` |
| `sections/Header.js`, `Footer.js`, `CTA.js`, `pages/main/Home.js` | `components/landing/*`, `src/app/page.tsx` |
| `pages/auth/*.js` | `components/auth/AuthLayout.tsx`, `app/login`, `register`, `forgot-password`, `reset-password` |
| `pages/main/Legal.js`, `NotFound.js` | `components/auth/StaticPage.tsx`, `app/privacy`, `app/terms`, `app/not-found.tsx` (+ new `app/offline`) |
| `sections/ClientLayout.js`, `Workspace.js`, `DashboardSidebar.js`, `DashboardParts.js`, `AddExpenseModal.js`, `GroupModal.js`, `Modal.js`, `Toast.js`, `Confirm.js` | `components/dashboard/*`, `components/layout/DashboardSidebar.tsx`, `components/ui/Modal.tsx`, `components/providers/*` |
| `pages/client/*.js` | `app/client/**/page.tsx` |
| `pages/admin/AdminLayout.js`, `AdminPages.js` | `app/admin/layout.tsx`, `components/dashboard/AdminShell.tsx`, `components/admin/AdminPages.tsx`, `app/admin/**/page.tsx` |

## 5. Behaviour differences

All intentional and small:

- **Login redirect:** the page to return to is passed as `/login?from=/client/...`. React Router's hidden navigation state doesn't exist in Next.js.
- **Offline is better covered.** All static pages and their files are cached when the service worker installs, so every page's interface opens offline, even pages not visited yet. A page that can't be available (a group never opened on the device) shows the new `/offline` page. Data still needs a connection, as before.
- **Row menus no longer clipped.** The "…" menu on the last rows of the expense and payment lists is no longer cut off by the panel edge.
- **Security headers added:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and no caching for `sw.js`.

## 6. What this means for the thesis

- The thesis can now describe **Next.js, TypeScript and Tailwind CSS**, and that matches the code. Describe it as it is: a **client-rendered Next.js App Router application**. Supabase is called from the browser, and access is enforced by RLS. Don't claim server-side rendering of user data, Server Actions or API routes; Payo doesn't use them.
- Take code examples and figures from `docs/TECHNICAL_DOCUMENTATION.md` (TypeScript and Tailwind examples) and `docs/diagrams/*.png`.
- Your professor previously asked for the thesis to be corrected to the React/CRA stack. Since the application itself was changed instead, it's worth telling them directly that Payo was migrated, and when, so the change isn't discovered in the Git history. The previous version (`v1.0.0`, see §8) stays available for comparison.
- The database chapter is unchanged: 6 tables, roles in `profiles.role`, **no** `user_roles` table.

## 7. Manual steps

1. Create `.env.local` from `.env.example` (`NEXT_PUBLIC_…` names). The old `REACT_APP_…` names in an existing `.env` are still accepted as a fallback (`next.config.ts`), so login works with the previous file too. Restart the dev server after changing them.
2. Supabase: no SQL changes. Optionally run `supabase/verify_schema.sql` to confirm the live database matches.
3. Supabase → Authentication → URL Configuration: the site URL and redirect URLs (`/client`, `/reset-password`) stay the same; update them only if the deployment URL changes.
4. Run the NOT TESTED cases in `docs/TESTING_REPORT.md` against the real project.

## 8. Git, submission and authorship

Nothing was committed, pushed or tagged.

**Recommended history:** keep the React/CRA version and the migration as separate, visible steps.

```bash
# 1. In your existing repository: commit and tag the audited React/CRA version first
git add -A && git commit -m "docs: correct technology description and add technical documentation"
git tag -a v1.0.0 -m "Payo v1.0.0 – React (Create React App) version"

# 2. Replace the project files with this migrated version (keep .git and .env.local), then:
git rm -r --cached . -q && git add -A && git status        # check: no .env.local, node_modules, .next
npm ci && npm run typecheck && npm run lint && npm test && npm run build
git commit -m "refactor: migrate Payo to Next.js, TypeScript and Tailwind CSS

- Replace Create React App and React Router with the Next.js App Router
- Convert all source files from JavaScript to strict TypeScript
- Replace CSS files with Tailwind CSS (same design tokens and layout)
- Self-host fonts with next/font, add app/manifest.ts and public/sw.js
- Replace Jest with Vitest; add Playwright browser tests with mocked Supabase
- Rename env variables to NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
- Database schema and RLS policies unchanged"
git tag -a v2.0.0 -m "Payo v2.0.0 – Next.js + TypeScript + Tailwind CSS (final submission)"
git push origin main --follow-tags

# 3. Submission ZIP identical to GitHub
git archive --format=zip --prefix=payo/ -o payo-v2.0.0.zip v2.0.0
```

If the React/CRA version was never committed, skip step 1 and tag the migration as `v1.0.0`.

**Authorship:** don't rewrite old commits. Set `git config user.name` / `user.email` to the name in your thesis and your GitHub e-mail for new commits. The migration was carried out with an AI assistant (Claude). State this in the thesis (e.g. in a "Development process" or "Tools used" section), as your university's rules on AI use require. Describe your own role: design, requirements, database, decisions, testing with real accounts.

## 9. Remaining limitations (unchanged from the audit)

- `add_member_by_email` reveals whether an e-mail is registered.
- Invite codes never expire.
- Removed members with an open balance cannot be settled with.
- Any member can record a payment between two other members.
- The group currency cannot be changed in the UI (EUR only).
- Offline: no data is stored or queued.
