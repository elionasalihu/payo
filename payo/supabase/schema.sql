-- Payo database schema
-- Run this whole file once in Supabase -> SQL Editor -> New query -> Run.
-- It is safe to re-run: objects are dropped/recreated where needed.

-- Tables

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(trim(name)) between 1 and 60),
  description  text not null default '',
  currency     text not null default 'EUR',
  invite_code  text not null unique
               default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  description   text not null check (char_length(trim(description)) between 1 and 100),
  amount        numeric(12, 2) not null check (amount > 0),
  category      text not null default 'general',
  paid_by       uuid not null references public.profiles (id) on delete cascade,
  expense_date  date not null default current_date,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists public.expense_splits (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  amount      numeric(12, 2) not null check (amount >= 0),
  primary key (expense_id, user_id)
);

create table if not exists public.settlements (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  from_user   uuid not null references public.profiles (id) on delete cascade,
  to_user     uuid not null references public.profiles (id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  note        text not null default '',
  created_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  check (from_user <> to_user)
);

create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists expenses_group_idx     on public.expenses (group_id);
create index if not exists splits_user_idx        on public.expense_splits (user_id);
create index if not exists settlements_group_idx  on public.settlements (group_id);

-- Helper functions (security definer -> avoid RLS recursion)

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.shares_group_with(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = p_user_id
  );
$$;

-- Triggers

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile email in sync if the user changes it.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Only admins may change roles (SQL editor / service role is allowed so you
-- can promote the first admin).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  if new.role is distinct from old.role and new.id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Row level security

alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements    enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id) or public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- groups (insert goes through create_group RPC)
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups for select to authenticated
  using (public.is_group_member(id) or public.is_admin());

drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups for update to authenticated
  using (public.is_group_owner(id) or public.is_admin())
  with check (public.is_group_owner(id) or public.is_admin());

drop policy if exists "groups_delete" on public.groups;
create policy "groups_delete" on public.groups for delete to authenticated
  using (public.is_group_owner(id) or public.is_admin());

-- group_members (insert goes through RPCs)
drop policy if exists "members_select" on public.group_members;
create policy "members_select" on public.group_members for select to authenticated
  using (public.is_group_member(group_id) or public.is_admin());

drop policy if exists "members_delete" on public.group_members;
create policy "members_delete" on public.group_members for delete to authenticated
  using (
    (user_id = auth.uid() and role <> 'owner')
    or (public.is_group_owner(group_id) and user_id <> auth.uid())
    or public.is_admin()
  );

-- expenses (insert goes through create_expense RPC)
drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select" on public.expenses for select to authenticated
  using (public.is_group_member(group_id) or public.is_admin());

drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_delete" on public.expenses for delete to authenticated
  using (
    created_by = auth.uid()
    or paid_by = auth.uid()
    or public.is_group_owner(group_id)
    or public.is_admin()
  );

-- expense_splits
drop policy if exists "splits_select" on public.expense_splits;
create policy "splits_select" on public.expense_splits for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );

-- settlements
drop policy if exists "settlements_select" on public.settlements;
create policy "settlements_select" on public.settlements for select to authenticated
  using (public.is_group_member(group_id) or public.is_admin());

drop policy if exists "settlements_insert" on public.settlements;
create policy "settlements_insert" on public.settlements for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_group_member(group_id)
    and public.is_group_member(group_id, from_user)
    and public.is_group_member(group_id, to_user)
  );

drop policy if exists "settlements_delete" on public.settlements;
create policy "settlements_delete" on public.settlements for delete to authenticated
  using (created_by = auth.uid() or public.is_group_owner(group_id) or public.is_admin());

-- RPC functions (called from the app with supabase.rpc)

-- Create a group and make the caller its owner.
create or replace function public.create_group(p_name text, p_description text default '')
returns public.groups
language plpgsql security definer set search_path = public
as $$
declare
  v_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.groups (name, description, created_by)
  values (trim(p_name), coalesce(trim(p_description), ''), auth.uid())
  returning * into v_group;

  insert into public.group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'owner');

  return v_group;
end;
$$;

-- Join a group with its invite code.
create or replace function public.join_group(p_code text)
returns public.groups
language plpgsql security definer set search_path = public
as $$
declare
  v_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_group from public.groups
  where invite_code = upper(trim(p_code));

  if v_group.id is null then
    raise exception 'No group found with that invite code';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, auth.uid())
  on conflict do nothing;

  return v_group;
end;
$$;

-- Add an existing Payo user to a group by email.
create or replace function public.add_member_by_email(p_group_id uuid, p_email text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'You are not a member of this group';
  end if;

  select * into v_profile from public.profiles
  where lower(email) = lower(trim(p_email));

  if v_profile.id is null then
    raise exception 'No Payo account uses that email. Ask them to sign up first, or share the invite code.';
  end if;

  if public.is_group_member(p_group_id, v_profile.id) then
    raise exception '% is already in this group', v_profile.full_name;
  end if;

  insert into public.group_members (group_id, user_id) values (p_group_id, v_profile.id);

  return json_build_object('id', v_profile.id, 'full_name', v_profile.full_name, 'email', v_profile.email);
end;
$$;

-- Create an expense together with its splits, atomically.
-- p_splits: [{"user_id": "...", "amount": 12.50}, ...]  (must sum to p_amount)
create or replace function public.create_expense(
  p_group_id     uuid,
  p_description  text,
  p_amount       numeric,
  p_paid_by      uuid,
  p_splits       jsonb,
  p_category     text default 'general',
  p_expense_date date default current_date
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_expense_id uuid;
  v_split      jsonb;
  v_total      numeric(12, 2) := 0;
  v_count      int := 0;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'You are not a member of this group';
  end if;

  if not public.is_group_member(p_group_id, p_paid_by) then
    raise exception 'The payer must be a member of the group';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception 'Choose at least one person to split with';
  end if;

  for v_split in select * from jsonb_array_elements(p_splits) loop
    if not public.is_group_member(p_group_id, (v_split ->> 'user_id')::uuid) then
      raise exception 'Everyone in the split must be a member of the group';
    end if;
    v_total := v_total + round((v_split ->> 'amount')::numeric, 2);
    v_count := v_count + 1;
  end loop;

  if v_total <> round(p_amount, 2) then
    raise exception 'Split amounts (%) must add up to the total (%)', v_total, round(p_amount, 2);
  end if;

  insert into public.expenses (group_id, description, amount, category, paid_by, expense_date, created_by)
  values (p_group_id, trim(p_description), round(p_amount, 2), coalesce(p_category, 'general'),
          p_paid_by, coalesce(p_expense_date, current_date), auth.uid())
  returning id into v_expense_id;

  insert into public.expense_splits (expense_id, user_id, amount)
  select v_expense_id, (s ->> 'user_id')::uuid, round((s ->> 'amount')::numeric, 2)
  from jsonb_array_elements(p_splits) s;

  return v_expense_id;
end;
$$;

-- Leave a group. The owner hands ownership to the longest-standing member,
-- or the group is deleted if they were the last member.
create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_next uuid;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'You are not a member of this group';
  end if;

  if public.is_group_owner(p_group_id) then
    select user_id into v_next from public.group_members
    where group_id = p_group_id and user_id <> auth.uid()
    order by joined_at limit 1;

    if v_next is null then
      delete from public.groups where id = p_group_id;
      return;
    end if;

    update public.group_members set role = 'owner'
    where group_id = p_group_id and user_id = v_next;
  end if;

  delete from public.group_members where group_id = p_group_id and user_id = auth.uid();
end;
$$;

-- Permissions

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, role) on public.profiles to authenticated; -- email is managed by auth
grant select, delete on public.groups to authenticated;
revoke update on public.groups from authenticated;
grant update (name, description, currency) on public.groups to authenticated; -- invite_code / created_by stay locked
grant select, delete on public.group_members to authenticated;
grant select, delete on public.expenses to authenticated;
grant select on public.expense_splits to authenticated;
grant select, insert, delete on public.settlements to authenticated;

revoke execute on function public.create_group(text, text) from anon;
revoke execute on function public.join_group(text) from anon;
revoke execute on function public.add_member_by_email(uuid, text) from anon;
revoke execute on function public.create_expense(uuid, text, numeric, uuid, jsonb, text, date) from anon;
revoke execute on function public.leave_group(uuid) from anon;

-- Backfill: profiles for users who signed up before this script ran

insert into public.profiles (id, email, full_name)
select u.id,
       coalesce(u.email, ''),
       coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do nothing;

-- Make yourself admin (edit the email, then run this line on its own)
-- update public.profiles set role = 'admin' where email = 'you@example.com';
