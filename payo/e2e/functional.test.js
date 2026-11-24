// Browser tests for Payo with a mocked Supabase backend (no real database is used).
// Run against a production build made with .env.example-style values whose project ref is "example":
//   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test npm run build && npm start
//   npm run e2e
const { chromium } = require('playwright');
const mock = require('./mock-supabase');
const BASE = process.env.E2E_BASE_URL || 'http://localhost:3100';
const results = [];
const rec = (id, input, expected, actual, pass) => { results.push({ id, input, expected, actual, status: pass ? 'PASS' : 'FAIL' }); };
const G1 = mock.ids.G1;

async function ctxFor(browser, { signedIn, role } = {}) {
  process.env.MOCK_ROLE = role || '';
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
  await mock.install(ctx);
  if (signedIn) await ctx.addInitScript(mock.storageScript('example'));
  return ctx;
}
const lastCall = (re) => [...mock.calls].reverse().find((c) => re.test(c.path));

(async () => {
  const browser = await chromium.launch();
  let ctx, page;

  // 1. Signed-out user opening a protected page
  ctx = await ctxFor(browser, {}); page = await ctx.newPage();
  await page.goto(BASE + '/client/expenses'); await page.waitForURL(/\/login/, { timeout: 8000 }).catch(() => {});
  rec('Protected route, signed out', 'open /client/expenses without session', 'redirect to /login?from=/client/expenses', page.url().replace(BASE, ''), page.url().includes('/login?from=%2Fclient%2Fexpenses'));

  // 2. Wrong password
  await page.fill('input[type=email]', 'alex@example.com'); await page.fill('input[type=password]', 'wrong');
  await page.click('button[type=submit]'); await page.waitForTimeout(800);
  const err = await page.locator('[role=alert]').first().innerText().catch(() => '');
  rec('Login, wrong password', 'alex@example.com / wrong', 'error message, stays on /login', `${err} | ${page.url().replace(BASE, '')}`, err.includes("don’t match") && page.url().includes('/login'));

  // 3. Correct password -> back to original page
  await page.fill('input[type=password]', 'correct-password'); await page.click('button[type=submit]');
  await page.waitForURL(/\/client\/expenses/, { timeout: 8000 }).catch(() => {});
  rec('Login, valid credentials', 'alex@example.com / correct-password', 'redirect back to /client/expenses', page.url().replace(BASE, ''), page.url().endsWith('/client/expenses'));

  // 4. Logout
  await page.goto(BASE + '/client/settings'); await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Sign out', exact: true }).last().click(); await page.waitForURL(/\/login/, { timeout: 8000 }).catch(() => {});
  rec('Logout', 'Settings -> Sign out', 'session removed, redirected to /login', page.url().replace(BASE, ''), page.url().includes('/login') && Boolean(lastCall(/\/auth\/v1\/logout/)));
  await ctx.close();

  // 5. Normal user opening /admin
  ctx = await ctxFor(browser, { signedIn: true, role: 'user' }); page = await ctx.newPage();
  await page.goto(BASE + '/admin/users'); await page.waitForURL(/\/client$/, { timeout: 8000 }).catch(() => {});
  const adminLink = await page.locator('a[href="/admin"]').count();
  rec('Admin route as normal user', 'role=user opens /admin/users', 'redirect to /client, no admin link in sidebar', `${page.url().replace(BASE, '')}, admin links: ${adminLink}`, page.url().endsWith('/client') && adminLink === 0);
  await ctx.close();

  // 6. Admin opening /admin
  ctx = await ctxFor(browser, { signedIn: true, role: 'admin' }); page = await ctx.newPage();
  await page.goto(BASE + '/admin/users'); await page.waitForTimeout(1500);
  const rows = await page.locator('tbody tr').count();
  rec('Admin route as admin', 'role=admin opens /admin/users', 'users table with 4 accounts', `${page.url().replace(BASE, '')}, rows: ${rows}`, page.url().endsWith('/admin/users') && rows === 4);

  // 7. Equal split €100 / 3
  await page.goto(BASE + '/client'); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Add expense' }).first().click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('select').first().selectOption(G1);
  await dlg.getByPlaceholder('e.g. Dinner at Artigiano').fill('Test dinner');
  await dlg.getByPlaceholder('0.00').first().fill('100');
  await page.waitForTimeout(300);
  const preview = await dlg.locator('text=/each$/').innerText().catch(() => '');
  const shares = await dlg.locator('label span.whitespace-nowrap').allInnerTexts();
  await page.getByRole('button', { name: 'Save expense' }).click(); await page.waitForTimeout(800);
  const call = lastCall(/rpc\/create_expense/); const payload = call ? JSON.parse(call.body) : {};
  const sum = (payload.p_splits || []).reduce((s, x) => s + Math.round(x.amount * 100), 0);
  rec('Equal split €100.00 between 3', 'amount 100, 3 members selected', 'preview “€33.33–€33.34 each”; shares 33.34/33.33/33.33; RPC splits sum to 10000 cents', `preview “${preview}”; shares ${shares.join(' / ')}; p_amount ${payload.p_amount}; splits ${JSON.stringify((payload.p_splits || []).map((s) => s.amount))} (sum ${sum} cents)`,
    preview === '€33.33–€33.34 each' && payload.p_amount === 100 && sum === 10000 && JSON.stringify((payload.p_splits || []).map((s) => s.amount)) === '[33.34,33.33,33.33]');

  // 8. Exact split that doesn't add up
  await page.getByRole('button', { name: 'Add expense' }).first().click();
  await dlg.locator('select').first().selectOption(G1);
  await dlg.getByPlaceholder('e.g. Dinner at Artigiano').fill('Uneven');
  await dlg.getByPlaceholder('0.00').first().fill('50');
  await dlg.getByRole('button', { name: 'Exact amounts' }).click();
  const shareInputs = dlg.locator('input[aria-label$="share"]');
  await shareInputs.nth(0).fill('20'); await shareInputs.nth(1).fill('20');
  const before = mock.calls.filter((c) => /create_expense/.test(c.path)).length;
  await page.getByRole('button', { name: 'Save expense' }).click(); await page.waitForTimeout(500);
  const exErr = await dlg.locator('[role=alert]').innerText().catch(() => '');
  const after = mock.calls.filter((c) => /create_expense/.test(c.path)).length;
  rec('Exact split validation', 'total 50, shares 20 + 20', 'error “€10.00 still needs to be assigned.”, nothing sent', `“${exErr}”, requests sent: ${after - before}`, exErr.includes('€10.00 still needs to be assigned') && after === before);
  await page.keyboard.press('Escape');

  // 9. Group detail balances + settle up suggestion
  await page.goto(BASE + `/client/groups/${G1}`); await page.waitForTimeout(1200);
  const balance = await page.locator('text=/^\\+€1,478\\.46$/').first().innerText().catch(() => '');
  const settleRows = await page.getByRole('button', { name: 'Settle', exact: true }).count();
  rec('Group balances', 'open Flat group (mock data)', 'your balance +€1,478.46, 2 settle-up suggestions', `balance “${balance}”, suggestions ${settleRows}`, balance === '+€1,478.46' && settleRows === 2);

  // 10. Record payment from suggestion
  await page.getByRole('button', { name: 'Settle', exact: true }).first().click(); await page.waitForTimeout(300);
  const amountVal = await page.getByRole('dialog').getByPlaceholder('0.00').inputValue();
  await page.getByRole('button', { name: 'Record payment' }).last().click(); await page.waitForTimeout(800);
  const sCall = [...mock.calls].reverse().find((c) => /\/rest\/v1\/settlements/.test(c.path) && c.method === 'POST'); const sBody = sCall && sCall.method === 'POST' ? JSON.parse(sCall.body) : null;
  rec('Record payment (settle up)', 'click Settle on first suggestion, confirm', 'settlements insert with suggested amount', sBody ? `amount field ${amountVal}; inserted ${JSON.stringify({ from: sBody.from_user.slice(0, 8), to: sBody.to_user.slice(0, 8), amount: sBody.amount })}` : 'no insert', Boolean(sBody) && sBody.amount === Number(amountVal));

  // 11. Create group
  await page.goto(BASE + '/client/groups'); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'New group' }).click();
  await page.getByPlaceholder('e.g. Trip to Tirana').fill('Ski trip');
  await page.getByRole('button', { name: 'Create group' }).click(); await page.waitForTimeout(1000);
  const gCall = lastCall(/rpc\/create_group/);
  rec('Create group', 'name “Ski trip”', 'create_group RPC called, navigate to the new group', `${gCall ? gCall.body : 'no call'} -> ${page.url().replace(BASE, '')}`, Boolean(gCall) && JSON.parse(gCall.body).p_name === 'Ski trip' && page.url().includes('/client/groups/aaaaaaaa-0000-4000-8000-00000000000n'));

  // 12. Activity
  await page.goto(BASE + '/client/activity'); await page.waitForTimeout(1000);
  const items = await page.locator('li').count();
  await page.getByRole('button', { name: 'Payments', exact: true }).click();
  const payItems = await page.locator('li').count();
  rec('Activity history + filter', 'open Activity, filter Payments', 'all events listed; filter shows 1 payment', `all: ${items}, payments: ${payItems}`, items === 16 && payItems === 1);

  // 13. PWA shortcut ?add=expense
  await page.goto(BASE + '/client?add=expense'); await page.waitForTimeout(1500);
  const dialogOpen = await page.getByRole('dialog').count();
  rec('PWA shortcut /client?add=expense', 'open URL', 'Add expense dialog opens, ?add removed from URL', `dialogs: ${dialogOpen}, url ${page.url().replace(BASE, '')}`, dialogOpen === 1 && !page.url().includes('add='));
  await ctx.close();

  // 14. Registration does not send a role
  ctx = await ctxFor(browser, {}); page = await ctx.newPage();
  await page.goto(BASE + '/register'); await page.waitForTimeout(800);
  await page.getByPlaceholder('Your full name').fill('New Person');
  await page.getByPlaceholder('you@example.com').fill('new@example.com');
  await page.getByPlaceholder('At least 8 characters').fill('longpassword');
  await page.getByPlaceholder('Repeat password').fill('longpassword');
  await page.getByRole('button', { name: 'Create account' }).click(); await page.waitForTimeout(1000);
  const su = lastCall(/\/auth\/v1\/signup/); const suBody = su ? JSON.parse(su.body) : {};
  rec('Registration payload', 'name, email, password', 'signup sends only full_name as metadata (no role)', su ? `data: ${JSON.stringify(suBody.data)}` : 'no request', Boolean(su) && JSON.stringify(suBody.data) === '{"full_name":"New Person"}');
  await ctx.close();

  await browser.close();
  console.log(JSON.stringify(results, null, 1));
  process.exitCode = results.some((r) => r.status !== "PASS") ? 1 : 0;
})();
