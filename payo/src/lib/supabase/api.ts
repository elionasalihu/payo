import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "./client";
import type {
  AdminData,
  Expense,
  Group,
  GroupMember,
  Profile,
  Role,
  Settlement,
  WorkspaceData,
} from "../types";

// Every database call used by the app. Components never call Supabase directly
// (except authentication in AuthProvider), so this file is the full list of
// queries and mutations. All of them run with the signed-in user's JWT and are
// checked by the RLS policies in supabase/schema.sql.

function unwrap<T>({ data, error }: { data: T | null; error: PostgrestError | Error | null }): T {
  if (error) throw new Error(error.message || "Something went wrong");
  return data as T;
}

function requireClient(): SupabaseClient {
  if (!supabase) throw new Error("Supabase is not configured. Add your keys to .env.local.");
  return supabase;
}

// Workspace (everything the client dashboard needs, in one go)

export async function fetchWorkspace(userId: string): Promise<WorkspaceData> {
  const sb = requireClient();

  const memberships = unwrap<{ group_id: string }[]>(
    await sb.from("group_members").select("group_id").eq("user_id", userId)
  );
  const groupIds = memberships.map((m) => m.group_id);

  if (!groupIds.length) {
    return { groups: [], members: [], expenses: [], settlements: [] };
  }

  const [groups, members, expenses, settlements] = await Promise.all([
    sb.from("groups").select("*").in("id", groupIds).order("created_at", { ascending: true }),
    sb
      .from("group_members")
      .select("group_id, user_id, role, joined_at, profile:profiles(id, full_name, email)")
      .in("group_id", groupIds)
      .order("joined_at", { ascending: true }),
    sb
      .from("expenses")
      .select("*, splits:expense_splits(user_id, amount)")
      .in("group_id", groupIds)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    sb.from("settlements").select("*").in("group_id", groupIds).order("created_at", { ascending: false }),
  ]);

  return {
    groups: unwrap<Group[]>(groups),
    members: unwrap<GroupMember[]>(members as { data: GroupMember[] | null; error: PostgrestError | null }),
    expenses: unwrap<Expense[]>(expenses),
    settlements: unwrap<Settlement[]>(settlements),
  };
}

// Groups

export async function createGroup(name: string, description = ""): Promise<Group> {
  return unwrap<Group>(await requireClient().rpc("create_group", { p_name: name, p_description: description }));
}

export async function joinGroup(code: string): Promise<Group> {
  return unwrap<Group>(await requireClient().rpc("join_group", { p_code: code }));
}

export async function addMemberByEmail(
  groupId: string,
  email: string
): Promise<{ id: string; full_name: string; email: string }> {
  return unwrap(await requireClient().rpc("add_member_by_email", { p_group_id: groupId, p_email: email }));
}

export async function updateGroup(
  groupId: string,
  fields: Partial<Pick<Group, "name" | "description" | "currency">>
): Promise<Group> {
  return unwrap<Group>(await requireClient().from("groups").update(fields).eq("id", groupId).select().single());
}

export async function deleteGroup(groupId: string): Promise<void> {
  unwrap(await requireClient().from("groups").delete().eq("id", groupId));
}

export async function leaveGroup(groupId: string): Promise<void> {
  unwrap(await requireClient().rpc("leave_group", { p_group_id: groupId }));
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  unwrap(await requireClient().from("group_members").delete().eq("group_id", groupId).eq("user_id", userId));
}

// Expenses

export interface NewExpense {
  groupId: string;
  description: string;
  /** Total in euros, 2 decimals. */
  amount: number;
  paidBy: string;
  /** One entry per participant, amounts in euros (2 decimals), summing to `amount`. */
  splits: { user_id: string; amount: number }[];
  category: string;
  /** YYYY-MM-DD */
  date: string;
}

export async function createExpense({
  groupId,
  description,
  amount,
  paidBy,
  splits,
  category,
  date,
}: NewExpense): Promise<string> {
  return unwrap<string>(
    await requireClient().rpc("create_expense", {
      p_group_id: groupId,
      p_description: description,
      p_amount: amount,
      p_paid_by: paidBy,
      p_splits: splits,
      p_category: category,
      p_expense_date: date,
    })
  );
}

export async function deleteExpense(expenseId: string): Promise<void> {
  unwrap(await requireClient().from("expenses").delete().eq("id", expenseId));
}

// Settlements (records of payments made outside the app)

export interface NewSettlement {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  note?: string;
  createdBy: string;
}

export async function createSettlement({
  groupId,
  fromUser,
  toUser,
  amount,
  note = "",
  createdBy,
}: NewSettlement): Promise<void> {
  unwrap(
    await requireClient().from("settlements").insert({
      group_id: groupId,
      from_user: fromUser,
      to_user: toUser,
      amount,
      note,
      created_by: createdBy,
    })
  );
}

export async function deleteSettlement(id: string): Promise<void> {
  unwrap(await requireClient().from("settlements").delete().eq("id", id));
}

// Profile

export async function fetchProfile(userId: string): Promise<Profile | null> {
  return unwrap<Profile | null>(
    await requireClient().from("profiles").select("*").eq("id", userId).maybeSingle()
  );
}

export async function updateProfileName(userId: string, fullName: string): Promise<Profile> {
  const sb = requireClient();
  const profile = unwrap<Profile>(
    await sb.from("profiles").update({ full_name: fullName }).eq("id", userId).select().single()
  );
  await sb.auth.updateUser({ data: { full_name: fullName } });
  return profile;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await requireClient().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

// Admin (RLS lets admins read/modify everything)

export async function adminFetchAll(): Promise<AdminData> {
  const sb = requireClient();
  const [profiles, groups, members, expenses, settlements] = await Promise.all([
    sb.from("profiles").select("*").order("created_at", { ascending: false }),
    sb.from("groups").select("*").order("created_at", { ascending: false }),
    sb.from("group_members").select("group_id, user_id, role"),
    sb.from("expenses").select("*, splits:expense_splits(user_id, amount)").order("created_at", { ascending: false }),
    sb.from("settlements").select("*").order("created_at", { ascending: false }),
  ]);
  return {
    profiles: unwrap<Profile[]>(profiles),
    groups: unwrap<Group[]>(groups),
    members: unwrap<GroupMember[]>(members),
    expenses: unwrap<Expense[]>(expenses),
    settlements: unwrap<Settlement[]>(settlements),
  };
}

export async function adminSetRole(userId: string, role: Role): Promise<Profile> {
  return unwrap<Profile>(
    await requireClient().from("profiles").update({ role }).eq("id", userId).select().single()
  );
}
