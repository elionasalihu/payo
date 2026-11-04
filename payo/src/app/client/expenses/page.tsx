"use client";

import { useMemo, useState } from "react";
import { Plus, ReceiptText, Search } from "lucide-react";

import { useWorkspace } from "@/components/dashboard/Workspace";
import { useExpenseActions } from "@/components/dashboard/useExpenseActions";
import {
  EmptyState,
  ErrorBanner,
  ExpenseRow,
  PageHeader,
  SkeletonRows,
  page,
} from "@/components/dashboard/DashboardParts";
import { cx, form, panel, btnSm } from "@/components/ui/classes";
import { CATEGORIES } from "@/lib/format";
import { expenseImpact } from "@/lib/balances";
import { formatCents, toCents } from "@/lib/money";
import type { Expense } from "@/lib/types";

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function ExpensesPage() {
  const { groups, expenses, loading, error, refresh, userId, memberName, openAddExpense } = useWorkspace();
  const { menuFor } = useExpenseActions();

  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (groupFilter !== "all" && e.group_id !== groupFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (mineOnly && expenseImpact(e, userId) === 0 && e.paid_by !== userId) return false;
      if (q && !e.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [expenses, query, groupFilter, categoryFilter, mineOnly, userId]);

  const totals = useMemo(() => {
    let total = 0;
    let myShare = 0;
    filtered.forEach((e) => {
      total += toCents(e.amount);
      const share = (e.splits || []).find((s) => s.user_id === userId);
      if (share) myShare += toCents(share.amount);
    });
    return { total, myShare };
  }, [filtered, userId]);

  const byMonth = useMemo(() => {
    const map = new Map<string, Expense[]>();
    filtered.forEach((e) => {
      const k = monthKey(e.expense_date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return [...map.entries()];
  }, [filtered]);

  const hasFilters = Boolean(query) || groupFilter !== "all" || categoryFilter !== "all" || mineOnly;

  return (
    <>
      <PageHeader
        eyebrow="EXPENSES"
        title={
          <>
            All <strong>expenses.</strong>
          </>
        }
        description="Every shared expense across your groups."
        actions={
          <button
            type="button"
            className={page.headerAdd}
            onClick={() => openAddExpense(groupFilter !== "all" ? groupFilter : null)}
          >
            <Plus size={16} />
            Add expense
          </button>
        }
      />

      <ErrorBanner message={error} onRetry={refresh} />

      <section className={page.stats}>
        <div>
          <span>Expenses</span>
          <strong>{filtered.length}</strong>
        </div>
        <div>
          <span>Total spent</span>
          <strong>{formatCents(totals.total)}</strong>
        </div>
        <div>
          <span>Your share</span>
          <strong>{formatCents(totals.myShare)}</strong>
        </div>
      </section>

      <section className={panel.panelVisible}>
        <div className={page.toolbar}>
          <label className={page.search}>
            <Search size={15} />
            <input
              className={page.searchInput}
              placeholder="Search expenses"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search expenses"
            />
          </label>

          <select
            className={cx(form.select, page.filter)}
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            aria-label="Filter by group"
          >
            <option value="all">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            className={cx(form.select, page.filter)}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label className={page.check}>
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            Involving me
          </label>
        </div>

        {loading ? (
          <SkeletonRows count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={hasFilters ? "No matching expenses" : "No expenses yet"}
            text={
              hasFilters
                ? "Try a different search or filter."
                : "When you or your friends add expenses, they’ll appear here."
            }
            action={
              !hasFilters && groups.length > 0 ? (
                <button type="button" className={btnSm.primary} onClick={() => openAddExpense()}>
                  <Plus size={14} /> Add expense
                </button>
              ) : null
            }
          />
        ) : (
          byMonth.map(([key, items]) => (
            <div key={key}>
              <div className={page.monthLabel}>
                <span>{monthLabel(key)}</span>
                <span>{formatCents(items.reduce((s, e) => s + toCents(e.amount), 0))}</span>
              </div>
              <div className="flex flex-col">
                {items.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    userId={userId}
                    groupName={groupName(expense.group_id)}
                    memberName={memberName}
                    menuItems={menuFor(expense)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
