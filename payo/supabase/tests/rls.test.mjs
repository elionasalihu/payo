// Payo - database security tests (Row Level Security, roles, RPC functions).
//
// Run with:   npm run test:rls
//
// supabase/schema.sql is executed unchanged in PostgreSQL (PGlite) with a small stand-in for what Supabase
// provides: the roles `anon` and `authenticated`, the table auth.users and the function auth.uid(), which
// reads the user id from the request's JWT claims. Every query below is then run as a different user.
//
// This checks the schema and the policies as written in supabase/schema.sql. It does NOT replace a check on the
// real Supabase project; for that run supabase/verify_schema.sql there (see docs/TESTING_REPORT.md).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const schema = readFileSync(fileURLToPath(new URL("../schema.sql", import.meta.url)), "utf8");

const U1 = "00000000-0000-4000-8000-000000000001"; // member of the group "U1 flat"
const U2 = "00000000-0000-4000-8000-000000000002"; // member of a different group
const U3 = "00000000-0000-4000-8000-000000000003"; // member of "U1 flat", not its owner
const A = "00000000-0000-4000-8000-0000000000aa"; // administrator
const U4 = "00000000-0000-4000-8000-000000000004"; // registers with { role: 'admin' } in the metadata

let db;
let groupU1; // "U1 flat"
let groupU2; // "U2 trip"

// Stand-in for Supabase's own objects (not part of schema.sql).
const SUPABASE_STANDIN = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  -- Supabase reads the user id from the JWT claims of the current request
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
`;

/** Runs `fn` with the session of `uid` (null = no JWT, as for a request without a session). */
async function as(uid, fn, role = "authenticated") {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  }
}
const q = (sql, params) => db.query(sql, params);
async function failsWith(promise, pattern) {
  await assert.rejects(promise, (e) => {
    assert.match(String(e.message), pattern);
    return true;
  });
}

before(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STANDIN);
  await db.exec(schema);

  // Users are created the way Supabase does it: a row in auth.users; the trigger creates the profile.
  for (const [id, email, name] of [
    [U1, "u1@example.com", "u1"],
    [U2, "u2@example.com", "u2"],
    [U3, "u3@example.com", "u3"],
    [A, "admin@example.com", "admin"],
  ]) {
    await q("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [id, email, JSON.stringify({ full_name: name })]);
  }
  await q("update public.profiles set role = 'admin' where id = $1", [A]); // like the SQL-editor step in the README

  // U1 creates "U1 flat" and U3 joins it with the invite code; U2 creates a second group.
  groupU1 = (await as(U1, () => q("select * from public.create_group('U1 flat', '')"))).rows[0];
  await as(U3, () => q("select * from public.join_group($1)", [groupU1.invite_code]));
  groupU2 = (await as(U2, () => q("select * from public.create_group('U2 trip', '')"))).rows[0];
  // an expense in U2's group, which U1 must never see
  await as(U2, () =>
    q("select public.create_expense($1, 'Hotel', 60, $2, $3::jsonb)", [groupU2.id, U2, JSON.stringify([{ user_id: U2, amount: 60 }])]),
  );
});

after(async () => {
  await db.close();
});

test("1. Reading profiles: only your own and those of people in your groups", async () => {
  const res = await as(U1, () => q("select full_name from public.profiles order by full_name"));
  assert.deepEqual(res.rows.map((r) => r.full_name), ["u1", "u3"]);
});

test("2. Other groups: U1 sees only its own group", async () => {
  const res = await as(U1, () => q("select id, name from public.groups"));
  assert.equal(res.rows.length, 1);
  assert.equal(res.rows[0].name, "U1 flat");
});

test("3. Expenses of another group: 0 rows", async () => {
  const res = await as(U1, () => q("select id from public.expenses where group_id = $1", [groupU2.id]));
  assert.equal(res.rows.length, 0);
});

test("4. Direct insert into expenses is refused (only through the RPC)", async () => {
  await failsWith(
    as(U1, () => q("insert into public.expenses (group_id, description, amount, paid_by) values ($1, 'x', 10, $2)", [groupU1.id, U1])),
    /row-level security|permission denied/i,
  );
});

test("5. RPC create_expense in someone else's group is refused", async () => {
  await failsWith(
    as(U1, () => q("select public.create_expense($1, 'x', 10, $2, $3::jsonb)", [groupU2.id, U1, JSON.stringify([{ user_id: U1, amount: 10 }])])),
    /You are not a member of this group/,
  );
});

test("6. Splits that do not add up to the total are refused on the server; nothing is saved", async () => {
  const before = (await q("select count(*)::int as n from public.expenses")).rows[0].n;
  await failsWith(
    as(U1, () =>
      q("select public.create_expense($1, 'Dinner', 100, $2, $3::jsonb)", [
        groupU1.id,
        U1,
        JSON.stringify([
          { user_id: U1, amount: 33.33 },
          { user_id: U3, amount: 33.33 },
        ]),
      ]),
    ),
    /Split amounts \(66\.66\) must add up to the total \(100\.00\)/,
  );
  assert.equal((await q("select count(*)::int as n from public.expenses")).rows[0].n, before);
});

test("7. A valid expense through the RPC saves the expense and its 2 splits together", async () => {
  const id = (
    await as(U1, () =>
      q("select public.create_expense($1, 'Groceries', 100, $2, $3::jsonb) as id", [
        groupU1.id,
        U1,
        JSON.stringify([
          { user_id: U1, amount: 50 },
          { user_id: U3, amount: 50 },
        ]),
      ]),
    )
  ).rows[0].id;
  const splits = await as(U1, () => q("select user_id from public.expense_splits where expense_id = $1", [id]));
  assert.equal(splits.rows.length, 2);
});

test("8. Self-promotion to admin is refused", async () => {
  await failsWith(as(U1, () => q("update public.profiles set role = 'admin' where id = $1", [U1])), /Only admins can change roles/);
});

test("9. Changing another user's role changes 0 rows (or fails)", async () => {
  let changed = 0;
  try {
    const res = await as(U1, () => q("update public.profiles set role = 'admin' where id = $1", [U2]));
    changed = res.affectedRows ?? 0;
  } catch {
    changed = 0;
  }
  assert.equal(changed, 0);
  assert.equal((await q("select role from public.profiles where id = $1", [U2])).rows[0].role, "user");
});

test("10. An admin cannot change their own role", async () => {
  await failsWith(as(A, () => q("update public.profiles set role = 'user' where id = $1", [A])), /You cannot change your own role/);
});

test("11. An admin can promote another user (1 row)", async () => {
  const res = await as(A, () => q("update public.profiles set role = 'admin' where id = $1", [U2]));
  assert.equal(res.affectedRows, 1);
  await q("update public.profiles set role = 'user' where id = $1", [U2]); // restore (run as the owner, like the SQL editor)
});

test("12. A role in the sign-up metadata is ignored: the profile gets role = user", async () => {
  await q("insert into auth.users (id, email, raw_user_meta_data) values ($1, 'u4@example.com', $2)", [U4, JSON.stringify({ full_name: "u4", role: "admin" })]);
  assert.equal((await q("select role from public.profiles where id = $1", [U4])).rows[0].role, "user");
});

test("13. An admin reads everything: all groups", async () => {
  const res = await as(A, () => q("select id from public.groups"));
  assert.equal(res.rows.length, 2);
});

test("14. A member who is not the owner cannot delete the group (0 rows)", async () => {
  const res = await as(U3, () => q("delete from public.groups where id = $1", [groupU1.id]));
  assert.equal(res.affectedRows, 0);
  assert.equal((await q("select count(*)::int as n from public.groups where id = $1", [groupU1.id])).rows[0].n, 1);
});

test("15. A settlement with someone outside the group is refused by settlements_insert", async () => {
  await failsWith(
    as(U1, () => q("insert into public.settlements (group_id, from_user, to_user, amount) values ($1, $2, $3, 10)", [groupU1.id, U1, U2])),
    /row-level security/i,
  );
});

test("16. A valid settlement (U3 pays U1 EUR 50 in the shared group) is saved", async () => {
  const res = await as(U3, () => q("insert into public.settlements (group_id, from_user, to_user, amount) values ($1, $2, $3, 50)", [groupU1.id, U3, U1]));
  assert.equal(res.affectedRows, 1);
});

test("17. A request without a session (auth.uid() is null) sees 0 rows", async () => {
  for (const table of ["profiles", "groups", "group_members", "expenses", "expense_splits", "settlements"]) {
    const res = await as(null, () => q(`select * from public.${table}`));
    assert.equal(res.rows.length, 0, table);
  }
});

test("18. Schema check (as in verify_schema.sql): 6 tables with RLS, 13 policies, no user_roles", async () => {
  const tables = await q("select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename");
  assert.deepEqual(
    tables.rows.map((r) => r.tablename),
    ["expense_splits", "expenses", "group_members", "groups", "profiles", "settlements"],
  );
  assert.ok(tables.rows.every((r) => r.rowsecurity === true));
  assert.equal((await q("select count(*)::int as n from pg_policies where schemaname = 'public'")).rows[0].n, 13);
  assert.equal((await q("select count(*)::int as n from information_schema.tables where table_name = 'user_roles'")).rows[0].n, 0);
});
