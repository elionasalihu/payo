"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "../providers/AuthProvider";
import { fetchWorkspace } from "@/lib/supabase/api";
import { buildSummary, type WorkspaceSummary } from "@/lib/balances";
import type { WorkspaceData } from "@/lib/types";

type GroupModalTab = "create" | "join";

export interface WorkspaceContextValue extends WorkspaceData {
  summary: WorkspaceSummary;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  userId: string | undefined;
  memberName: (id: string) => string;
  openAddExpense: (groupId?: string | null) => void;
  closeAddExpense: () => void;
  expenseModal: { open: boolean; groupId: string | null };
  openGroupModal: (tab?: GroupModalTab) => void;
  closeGroupModal: () => void;
  groupModal: { open: boolean; tab: GroupModalTab };
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const EMPTY: WorkspaceData = { groups: [], members: [], expenses: [], settlements: [] };

// Loads the user's groups, members, expenses and settlements once
// and shares them with all client pages (mounted by app/client/layout.tsx).
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<WorkspaceData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state shared by sidebar, mobile nav and pages
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; groupId: string | null }>({
    open: false,
    groupId: null,
  });
  const [groupModal, setGroupModal] = useState<{ open: boolean; tab: GroupModalTab }>({
    open: false,
    tab: "create",
  });

  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const next = await fetchWorkspace(userId);
      setData(next);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const summary = useMemo(() => buildSummary(data, userId), [data, userId]);

  const memberName = useCallback(
    (id: string) => {
      if (id === userId) return "You";
      const m = data.members.find((x) => x.user_id === id);
      return m?.profile?.full_name || m?.profile?.email || "Former member";
    },
    [data.members, userId]
  );

  const openAddExpense = useCallback(
    (groupId: string | null = null) => setExpenseModal({ open: true, groupId }),
    []
  );
  const closeAddExpense = useCallback(() => setExpenseModal((s) => ({ ...s, open: false })), []);
  const openGroupModal = useCallback((tab: GroupModalTab = "create") => setGroupModal({ open: true, tab }), []);
  const closeGroupModal = useCallback(() => setGroupModal((s) => ({ ...s, open: false })), []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...data,
      summary,
      loading,
      error,
      refresh,
      userId,
      memberName,
      openAddExpense,
      closeAddExpense,
      expenseModal,
      openGroupModal,
      closeGroupModal,
      groupModal,
    }),
    [
      data,
      summary,
      loading,
      error,
      refresh,
      userId,
      memberName,
      openAddExpense,
      closeAddExpense,
      expenseModal,
      openGroupModal,
      closeGroupModal,
      groupModal,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
