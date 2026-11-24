// Row types for the Supabase tables in supabase/schema.sql.
// Supabase (PostgREST) returns numeric(12,2) columns as JSON numbers,
// uuid / date / timestamptz columns as strings.

export type Role = "user" | "admin";
export type MemberRole = "owner" | "member";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  currency: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface MemberProfile {
  id: string;
  full_name: string;
  email: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at?: string;
  /** Joined from profiles (fetchWorkspace only). */
  profile?: MemberProfile | null;
}

export interface ExpenseSplit {
  user_id: string;
  amount: number;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  category: string;
  paid_by: string;
  expense_date: string;
  created_by: string | null;
  created_at: string;
  /** Joined from expense_splits. */
  splits?: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  note: string;
  created_by: string | null;
  created_at: string;
}

/** Everything the client dashboard loads in fetchWorkspace(). */
export interface WorkspaceData {
  groups: Group[];
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
}

/** Everything the admin pages load in adminFetchAll(). */
export interface AdminData extends WorkspaceData {
  profiles: Profile[];
}

/** Amounts are money in euros (or the group currency) unless the name ends in `Cents`. */
export type Cents = number;
