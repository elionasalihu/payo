// Fake Supabase backend for screenshots/functional checks. Nothing leaves the machine.
const U = { a: "11111111-1111-4111-8111-111111111111", b: "22222222-2222-4222-8222-222222222222", c: "33333333-3333-4333-8333-333333333333", d: "44444444-4444-4444-8444-444444444444" };
const G1 = "aaaaaaaa-0000-4000-8000-000000000001", G2 = "aaaaaaaa-0000-4000-8000-000000000002";
const profiles = [
  { id: U.a, email: "alex@example.com", full_name: "Alex Morgan", role: "admin", created_at: "2026-08-02T10:00:00Z" },
  { id: U.b, email: "bea@example.com", full_name: "Bea Krasniqi", role: "user", created_at: "2026-09-12T10:00:00Z" },
  { id: U.c, email: "chris@example.com", full_name: "Chris Hoxha", role: "user", created_at: "2026-10-05T10:00:00Z" },
  { id: U.d, email: "dana@example.com", full_name: "Dana Leka", role: "user", created_at: "2026-10-20T10:00:00Z" },
];
const P = (id) => { const p = profiles.find((x) => x.id === id); return { id: p.id, full_name: p.full_name, email: p.email }; };
const groups = [
  { id: G1, name: "Flat on Rruga Dibrës", description: "Rent, bills and groceries", currency: "EUR", invite_code: "7F3K9QAZ", created_by: U.a, created_at: "2026-08-03T09:00:00Z" },
  { id: G2, name: "Weekend in Prizren", description: "", currency: "EUR", invite_code: "B2M8XK4D", created_by: U.b, created_at: "2026-10-01T09:00:00Z" },
];
const members = [
  { group_id: G1, user_id: U.a, role: "owner", joined_at: "2026-08-03T09:00:00Z" },
  { group_id: G1, user_id: U.b, role: "member", joined_at: "2026-08-04T09:00:00Z" },
  { group_id: G1, user_id: U.c, role: "member", joined_at: "2026-08-05T09:00:00Z" },
  { group_id: G2, user_id: U.b, role: "owner", joined_at: "2026-10-01T09:00:00Z" },
  { group_id: G2, user_id: U.a, role: "member", joined_at: "2026-10-01T10:00:00Z" },
  { group_id: G2, user_id: U.d, role: "member", joined_at: "2026-10-02T10:00:00Z" },
];
let n = 0;
const ex = (group_id, description, amount, category, paid_by, expense_date, splits) => ({ id: `eeeeeeee-0000-4000-8000-${String(++n).padStart(12, "0")}`, group_id, description, amount, category, paid_by, expense_date, created_by: paid_by, created_at: `${expense_date}T1${n % 10}:00:00Z`, splits });
const three = (ids, a) => ids.map((u, i) => ({ user_id: u, amount: a[i] }));
const expenses = [
  ex(G1, "October rent", 900, "rent", U.a, "2026-10-01", three([U.a, U.b, U.c], [300, 300, 300])),
  ex(G1, "Groceries at Spar", 100, "groceries", U.b, "2026-10-26", three([U.a, U.b, U.c], [33.34, 33.33, 33.33])),
  ex(G1, "Electricity bill", 84.6, "utilities", U.c, "2026-10-29", three([U.a, U.b, U.c], [28.2, 28.2, 28.2])),
  ex(G2, "Hotel Prizren", 280, "stay", U.b, "2026-10-17", three([U.a, U.b, U.d], [93.34, 93.33, 93.33])),
  ex(G2, "Dinner at Ambient", 96.5, "food", U.a, "2026-10-18", three([U.a, U.b, U.d], [32.17, 32.17, 32.16])),
  ex(G2, "Taxi", 24.5, "transport", U.d, "2026-10-18", three([U.a, U.b, U.d], [8.17, 8.17, 8.16])),
  ex(G1, "September rent", 900, "rent", U.a, "2026-09-01", three([U.a, U.b, U.c], [300, 300, 300])),
  ex(G1, "Internet", 30, "utilities", U.b, "2026-09-10", three([U.a, U.b, U.c], [10, 10, 10])),
  ex(G1, "August rent", 900, "rent", U.a, "2026-08-05", three([U.a, U.b, U.c], [300, 300, 300])),
].sort((x, y) => (y.expense_date + y.created_at).localeCompare(x.expense_date + x.created_at));
const settlements = [
  { id: "ssssssss-0000-4000-8000-000000000001", group_id: G1, from_user: U.b, to_user: U.a, amount: 250, note: "", created_by: U.b, created_at: "2026-10-27T18:00:00Z" },
];

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const user = { id: U.a, aud: "authenticated", role: "authenticated", email: "alex@example.com", user_metadata: { full_name: "Alex Morgan" }, app_metadata: { provider: "email" }, created_at: "2026-08-02T10:00:00Z" };
const session = { access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: U.a, role: "authenticated", exp: now + 36000, aud: "authenticated", email: user.email })}.sig`, token_type: "bearer", expires_in: 36000, expires_at: now + 36000, refresh_token: "fake-refresh", user };

const calls = [];
function handle(url, method, accept, body) {
  const u = new URL(url);
  const path = u.pathname;
  calls.push({ method, path: path + u.search, body });
  if (path.startsWith("/auth/v1/token")) {
    const b = JSON.parse(body || "{}");
    if (b.password !== "correct-password") return { __status: 400, error: "invalid_grant", error_description: "Invalid login credentials", msg: "Invalid login credentials", code: "invalid_credentials" };
    return session;
  }
  if (path.startsWith("/auth/v1/logout")) return { __status: 204 };
  if (path.startsWith("/auth/v1/user")) return user;
  if (path.startsWith("/auth/v1/")) return {};
  const m = path.match(/\/rest\/v1\/(rpc\/)?([a-z_]+)/);
  if (!m) return {};
  if (m[1]) {
    if (m[2] === "create_expense") return "eeeeeeee-0000-4000-8000-999999999999";
    if (m[2] === "create_group") { const b = JSON.parse(body || "{}"); return { ...groups[0], id: "aaaaaaaa-0000-4000-8000-00000000000n", name: b.p_name }; }
    return {};
  }
  const t = m[2];
  const eq = (k) => { const v = u.searchParams.get(k); return v && v.startsWith("eq.") ? v.slice(3) : null; };
  let rows;
  if (t === "profiles") rows = profiles.filter((p) => !eq("id") || p.id === eq("id")).map((p) => p.id === U.a ? { ...p, role: process.env.MOCK_ROLE || p.role } : p);
  else if (t === "groups") rows = groups;
  else if (t === "group_members") {
    const sel = u.searchParams.get("select") || "";
    rows = members.filter((x) => !eq("user_id") || x.user_id === eq("user_id")).map((x) => sel.includes("profile") ? { ...x, profile: P(x.user_id) } : x);
  } else if (t === "expenses") rows = expenses;
  else if (t === "settlements") rows = settlements;
  else rows = [];
  if (method !== "GET") return rows.slice(0, 1);
  if ((accept || "").includes("vnd.pgrst.object")) return rows[0] || null;
  return rows;
}

async function install(context) {
  await context.route(/supabase\.co\//, async (route) => {
    const req = route.request();
    const data = handle(req.url(), req.method(), req.headers()["accept"], req.postData());
    if (data && data.__status === 204) return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" }, body: "" });
    const status = (data && data.__status) || 200;
    await route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(data) });
  });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  return { calls };
}

function storageScript(ref) {
  return `try{localStorage.setItem("sb-${ref}-auth-token", ${JSON.stringify(JSON.stringify(session))});}catch(e){}`;
}

module.exports = { install, storageScript, calls, ids: { U, G1, G2 } };
