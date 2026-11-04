"use client";

import { ExternalLink, Trash2 } from "lucide-react";

import { useWorkspace } from "./Workspace";
import { useToast } from "../providers/ToastProvider";
import { useConfirm } from "../providers/ConfirmProvider";
import type { MenuItem } from "./DashboardParts";
import { deleteExpense } from "@/lib/supabase/api";
import type { Expense } from "@/lib/types";

// Delete / open-group actions for an expense row. The same rule is enforced by
// the expenses_delete RLS policy (creator, payer, group owner or admin).
export function useExpenseActions() {
  const { userId, refresh, summary } = useWorkspace();
  const toast = useToast();
  const confirm = useConfirm();

  const canDelete = (expense: Expense) =>
    expense.created_by === userId ||
    expense.paid_by === userId ||
    Boolean(summary.byGroup[expense.group_id]?.members.some((m) => m.user_id === userId && m.role === "owner"));

  const remove = async (expense: Expense) => {
    const ok = await confirm({
      title: "Delete expense?",
      message: `“${expense.description}” will be removed for everyone in the group and balances will update.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteExpense(expense.id);
      toast.success("Expense deleted");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const menuFor = (expense: Expense, { showGroupLink = true } = {}): (MenuItem | false)[] => [
    showGroupLink && { label: "Open group", icon: ExternalLink, to: `/client/groups/${expense.group_id}` },
    canDelete(expense) && { label: "Delete", icon: Trash2, danger: true, onClick: () => remove(expense) },
  ];

  return { canDelete, remove, menuFor };
}
