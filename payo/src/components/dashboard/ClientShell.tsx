"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Activity, ChartColumn, CreditCard, LayoutDashboard, Users } from "lucide-react";

import DashboardSidebar, { type NavItem } from "../layout/DashboardSidebar";
import AddExpenseModal from "./AddExpenseModal";
import GroupModal from "./GroupModal";
import { WorkspaceProvider, useWorkspace } from "./Workspace";
import { page } from "./DashboardParts";

const navigation: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/client", end: true },
  { label: "Expenses", icon: CreditCard, to: "/client/expenses" },
  { label: "Groups", icon: Users, to: "/client/groups" },
  { label: "Summary", icon: ChartColumn, to: "/client/summary" },
  { label: "Activity", icon: Activity, to: "/client/activity" },
];

function Shell({ children }: { children: ReactNode }) {
  const { groups, members, openAddExpense, loading } = useWorkspace();
  const router = useRouter();

  // PWA shortcut: /client?add=expense opens the Add expense modal
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") !== "expense") return;
    openAddExpense();
    params.delete("add");
    const rest = params.toString();
    router.replace(`${window.location.pathname}${rest ? `?${rest}` : ""}`);
  }, [loading, openAddExpense, router]);

  const sidebarGroups = useMemo(
    () =>
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: members.filter((m) => m.group_id === g.id).length,
      })),
    [groups, members]
  );

  return (
    <div className="min-h-screen bg-payo-bg font-sans text-payo-ink">
      <DashboardSidebar navigation={navigation} groups={sidebarGroups} onAdd={() => openAddExpense()} />

      <main className={page.main}>{children}</main>

      <AddExpenseModal />
      <GroupModal />
    </div>
  );
}

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
