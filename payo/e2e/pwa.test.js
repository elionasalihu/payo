// Browser tests for Payo with a mocked Supabase backend (no real database is used).
// Run against a production build made with .env.example-style values whose project ref is "example":
//   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test npm run build && npm start
//   npm run e2e
const { chromium } = require('playwright');
const mock = require('./mock-supabase');
const BASE = process.env.E2E_BASE_URL || 'http://localhost:3100';
const R = [];
const rec = (id, input, expected, actual, pass) => R.push({ id, input, expected, actual, status: pass ? 'PASS' : 'FAIL' });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await mock.install(ctx); await ctx.addInitScript(mock.storageScript('example'));
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + '/'); 
  const manifestHref = await p.$eval('link[rel=manifest]', l => l.getAttribute('href')).catch(() => null);
  const man = await (await p.request.get(BASE + '/manifest.webmanifest')).json();
  rec('Manifest', 'GET /manifest.webmanifest', 'linked in <head>; name, start_url, standalone, 192/512 icons incl. maskable', `link ${manifestHref}; ${man.name}; ${man.start_url}; ${man.display}; icons ${man.icons.map(i => i.sizes + (i.purpose ? '/' + i.purpose : '')).join(', ')}`,
    manifestHref === '/manifest.webmanifest' && man.display === 'standalone' && man.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512'));
  await p.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => {});
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r && r.active ? r.active.scriptURL : null; });
  const swHeaders = (await p.request.get(BASE + '/sw.js')).headers();
  rec('Service worker registration', 'load / in production build', 'sw.js active and controlling the page; not HTTP-cached', `${sw}; cache-control: ${swHeaders['cache-control']}`, Boolean(sw) && /no-store/.test(swHeaders['cache-control'] || ''));
  // visit signed-in pages so they are cached
  await p.goto(BASE + '/client'); await p.waitForTimeout(1500);
  await p.goto(BASE + '/client/groups'); await p.waitForTimeout(1000);
  const caches = await p.evaluate(async () => { const out = {}; for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname); return out; });
  const pages = caches['payo-v1-pages'] || [];
  rec('Cache contents', 'after visiting /, /client, /client/groups', 'precached shell pages + visited pages; build JS/CSS; no Supabase URLs', `pages: ${pages.join(', ')}; static files: ${(caches['payo-v1-static'] || []).length}; any supabase: ${JSON.stringify(caches).includes('supabase')}`,
    ['/', '/login', '/offline', '/client', '/client/groups'].every(x => pages.includes(x)) && (caches['payo-v1-static'] || []).length > 0 && !JSON.stringify(caches).includes('supabase'));
  // offline
  // A real offline browser can't reach Supabase either
  await ctx.route(/supabase\.co\//, (r) => r.abort('internetdisconnected'));
  await ctx.setOffline(true);
  for (const [route, check] of [['/', 'Split expenses'], ['/login', 'Overview'], ['/client', 'Overview']]) {
    let ok = false, txt = '';
    try { await p.goto(BASE + route, { waitUntil: 'load' }); await p.waitForTimeout(4000); txt = (await p.locator('body').innerText()).slice(0, 4000); ok = txt.includes(check); } catch (e) { txt = e.message.slice(0, 80); }
    const banner = await p.locator('[data-testid=offline-banner]').count();
    rec(`Offline reload ${route}`, `offline, open ${route}`, 'interface loads from cache, offline banner shown', `${ok ? 'loaded' : 'NOT loaded'}; banner ${banner ? 'shown' : 'not shown'}${route === '/client' ? '; data: ' + (/Retry/.test(txt) ? 'Supabase request fails, error + Retry shown' : (txt.includes('€') ? 'figures shown' : 'empty')) : ''}`, ok && banner > 0);
  }
  let neverVisited = '';
  try { await p.goto(BASE + '/client/settings'); await p.waitForTimeout(4000); neverVisited = (await p.locator('body').innerText()).includes('Your account') ? 'settings rendered' : (await p.locator('body').innerText()).slice(0, 60); } catch (e) { neverVisited = e.message.slice(0, 60); }
  rec('Offline, page never opened', 'offline, open /client/settings (precached at install)', 'settings page renders', neverVisited, neverVisited.includes('rendered'));
  let grp = '';
  try { await p.goto(BASE + '/client/groups/aaaaaaaa-0000-4000-8000-000000000002'); await p.waitForTimeout(1500); grp = (await p.locator('h1').first().innerText()).replace(/\n/g, ' '); } catch (e) { grp = e.message.slice(0, 60); }
  rec('Offline, group never opened', 'offline, open a group page not visited before', 'offline page explains the page is not available offline', grp, /offline/i.test(grp));
  await ctx.setOffline(false); await p.waitForTimeout(800);
  rec('Reconnect', 'go online again', 'offline banner disappears', `banner count ${await p.locator('[data-testid=offline-banner]').count()}`, (await p.locator('[data-testid=offline-banner]').count()) === 0);
  rec('Console errors', 'whole run', 'no uncaught page errors', errors.length ? errors.join(' | ').slice(0, 200) : 'none', errors.length === 0);
  await b.close();
  console.log(JSON.stringify(R, null, 1));
  process.exitCode = R.some((r) => r.status !== "PASS") ? 1 : 0;
})();
