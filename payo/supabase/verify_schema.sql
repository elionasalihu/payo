-- Payo: READ-ONLY verification queries
-- Purpose: compare the live Supabase database with supabase/schema.sql.
-- Every statement below is a SELECT. Nothing is created, changed or deleted.
-- Run in Supabase -> SQL Editor. Run the queries one at a time and
-- check the result against the "Expected" comment above each one.

-- 1. Tables in the public schema
-- Expected: expense_splits, expenses, group_members, groups, profiles, settlements
--           (no user_roles table; roles are stored in profiles.role)
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- 2. Does a user_roles table exist anywhere?
-- Expected: 0 rows
select table_schema, table_name
from information_schema.tables
where table_name = 'user_roles';

-- 3. Columns of every Payo table
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'groups', 'group_members', 'expenses', 'expense_splits', 'settlements')
order by table_name, ordinal_position;

-- 4. Primary keys, foreign keys, unique and check constraints
select tc.table_name, tc.constraint_type, tc.constraint_name,
       pg_get_constraintdef(c.oid) as definition
from information_schema.table_constraints tc
join pg_constraint c on c.conname = tc.constraint_name
join pg_namespace n on n.oid = c.connamespace and n.nspname = tc.table_schema
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_type;

-- 5. Row Level Security is enabled on every table
-- Expected: rowsecurity = true for all 6 tables
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 6. RLS policies
-- Expected (13): profiles_select, profiles_update, groups_select, groups_update,
-- groups_delete, members_select, members_delete, expenses_select, expenses_delete,
-- splits_select, settlements_select, settlements_insert, settlements_delete
-- (compare names, commands and expressions with schema.sql)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 7. Functions used by RLS and the app
-- Expected: is_admin, is_group_member, is_group_owner, shares_group_with,
-- handle_new_user, handle_user_email_change, protect_profile_role,
-- create_group, join_group, add_member_by_email, create_expense, leave_group
-- prosecdef = true means SECURITY DEFINER
select p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 8. Triggers
-- Expected: on_auth_user_created and on_auth_user_email_changed on auth.users,
--           protect_profile_role on public.profiles
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_name in ('on_auth_user_created', 'on_auth_user_email_changed', 'protect_profile_role')
order by trigger_name;

-- 9. Column-level UPDATE grants for the "authenticated" role
-- Expected: profiles -> full_name, role ; groups -> name, description, currency
select table_name, column_name, privilege_type
from information_schema.column_privileges
where grantee = 'authenticated' and table_schema = 'public' and privilege_type = 'UPDATE'
order by table_name, column_name;

-- 10. Which accounts are administrators (shows emails, keep the output private)
select id, email, full_name, role, created_at
from public.profiles
where role = 'admin';

-- 11. Data integrity: every expense's splits add up to the expense amount
-- Expected: 0 rows
select e.id, e.description, e.amount, coalesce(sum(s.amount), 0) as splits_total
from public.expenses e
left join public.expense_splits s on s.expense_id = e.id
group by e.id, e.description, e.amount
having coalesce(sum(s.amount), 0) <> e.amount;

-- 12. Data integrity: every auth user has a profile
-- Expected: 0 rows
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 13. Balances of users who are no longer members of a group
-- (These debts cannot be settled in the app, because settlements require
--  both people to be current members. Informational only.)
with movements as (
  select group_id, paid_by as user_id, amount from public.expenses
  union all
  select e.group_id, s.user_id, -s.amount
  from public.expense_splits s join public.expenses e on e.id = s.expense_id
  union all
  select group_id, from_user, amount from public.settlements
  union all
  select group_id, to_user, -amount from public.settlements
)
select m.group_id, m.user_id, sum(m.amount) as net
from movements m
left join public.group_members gm on gm.group_id = m.group_id and gm.user_id = m.user_id
where gm.user_id is null
group by m.group_id, m.user_id
having sum(m.amount) <> 0;
