"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CreditCard, LayoutDashboard, Users, UsersRound } from "lucide-react";

import DashboardSidebar, { type NavItem } from "../layout/DashboardSidebar";
import { page } from "./DashboardParts";
import { adminFetchAll } from "@/lib/supabase/api";
import type { AdminData, Group, Profile } from "@/lib/types";

const navigation: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/admin", end: true },
  { label: "Users", icon: UsersRound, to: "/admin/users" },
  { label: "Groups", icon: Users, to: "/admin/groups" },
  { label: "Expenses", icon: CreditCard, to: "/admin/expenses" },
];

export interface AdminContextValue extends AdminData {
  profileById: Record<string, Profile>;
  groupById: Record<string, Group>;
  nameOf: (id: string) => string;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdminData(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminData must be used inside the admin layout");
  return ctx;
}

const EMPTY: AdminData = { profiles: [], groups: [], members: [], expenses: [], settlements: [] };

export default function AdminShell({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setData(await adminFetchAll());
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const lookups = useMemo(() => {
    const profileById: Record<string, Profile> = Object.fromEntries(data.profiles.map((p) => [p.id, p]));
    const groupById: Record<string, Group> = Object.fromEntries(data.groups.map((g) => [g.id, g]));
    return {
      profileById,
      groupById,
      nameOf: (id: string) => profileById[id]?.full_name || profileById[id]?.email || "Unknown user",
    };
  }, [data.profiles, data.groups]);

  const value = useMemo(
    () => ({ ...data, ...lookups, loading, error, refresh }),
    [data, lookups, loading, error, refresh]
  );

  return (
    <AdminContext.Provider value={value}>
      <div className="min-h-screen bg-payo-bg font-sans text-payo-ink">
        <DashboardSidebar navigation={navigation} variant="admin" homeTo="/admin" />
        <main className={page.main}>{children}</main>
      </div>
    </AdminContext.Provider>
  );
}
