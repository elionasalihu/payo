"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, ReceiptText, Users } from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";
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
import { cx, panel, toneClass, btnSm } from "@/components/ui/classes";
import { firstName, greeting, toneFor } from "@/lib/format";
import { formatCents } from "@/lib/money";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { groups, expenses, summary, loading, error, refresh, userId, memberName, openAddExpense, openGroupModal } =
    useWorkspace();
  const { menuFor } = useExpenseActions();

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name;
  const recent = expenses.slice(0, 5);

  const total = summary.totalCents;
  const settledGroups = groups.length - summary.oweGroups - summary.owedGroups;

  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW"
        title={
          <>
            {greeting()}, <strong>{firstName(profile?.full_name)}.</strong>
          </>
        }
        description="Here’s what’s happening with your shared expenses."
        actions={
          <button type="button" className={page.headerAdd} onClick={() => openAddExpense()}>
            <Plus size={16} />
            Add expense
          </button>
        }
      />

      <ErrorBanner message={error} onRetry={refresh} />

      {/* Balance cards */}
      <section className={page.balanceGrid}>
        <div className={cx(page.balanceCard, page.balanceMain)}>
          <div className={page.cardTopDark}>
            <span>Total balance</span>
            <div className={page.cardIcon}>
              <ReceiptText size={17} />
            </div>
          </div>

          <div className={page.balanceValue}>{loading ? "—" : formatCents(total, "EUR", { sign: true })}</div>

          <div className={page.balanceFooter}>
            {total > 0 && (
              <span className="inline-flex items-center gap-[3px] text-payo-green">
                <ArrowDownLeft size={13} />
                You are owed overall
              </span>
            )}
            {total < 0 && (
              <span className={page.negativeLight}>
                <ArrowUpRight size={13} />
                You owe overall
              </span>
            )}
            {total === 0 && <span className="inline-flex items-center gap-[3px] text-payo-green">All settled up</span>}
            <span>
              across {groups.length} group{groups.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className={page.balanceCard}>
          <div className={page.cardTop}>
            <span>You owe</span>
            <div className={page.cardIconRed}>
              <ArrowUpRight size={17} />
            </div>
          </div>

          <div className={page.smallValue}>{loading ? "—" : formatCents(summary.oweCents)}</div>

          <p className={page.cardDescription}>
            {summary.oweGroups
              ? `Across ${summary.oweGroups} group${summary.oweGroups === 1 ? "" : "s"}`
              : "Nothing to pay back"}
          </p>
        </div>

        <div className={page.balanceCard}>
          <div className={page.cardTop}>
            <span>You are owed</span>
            <div className={page.cardIconGreen}>
              <ArrowDownLeft size={17} />
            </div>
          </div>

          <div className={page.smallValue}>{loading ? "—" : formatCents(summary.owedCents)}</div>

          <p className={page.cardDescription}>
            {summary.owedGroups
              ? `Across ${summary.owedGroups} group${summary.owedGroups === 1 ? "" : "s"}`
              : settledGroups > 0
                ? "Nobody owes you right now"
                : "Nothing yet"}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className={page.contentGrid}>
        {/* Recent expenses */}
        <div className={panel.panelVisible}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>Recent expenses</h2>
              <p className={panel.subtitle}>Your latest shared expenses</p>
            </div>

            <Link href="/client/expenses" className={panel.headerLink}>
              View all
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col">
            {loading ? (
              <SkeletonRows />
            ) : recent.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No expenses yet"
                text={
                  groups.length
                    ? "Add the first expense to one of your groups."
                    : "Create a group first, then add expenses to it."
                }
                action={
                  <button
                    type="button"
                    className={btnSm.primary}
                    onClick={() => (groups.length ? openAddExpense() : openGroupModal("create"))}
                  >
                    <Plus size={14} />
                    {groups.length ? "Add expense" : "Create a group"}
                  </button>
                }
              />
            ) : (
              recent.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  userId={userId}
                  groupName={groupName(expense.group_id)}
                  memberName={memberName}
                  menuItems={menuFor(expense)}
                />
              ))
            )}
          </div>
        </div>

        {/* Groups */}
        <div className={panel.panel}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>Your groups</h2>
              <p className={panel.subtitle}>Where your money is shared</p>
            </div>

            <Link href="/client/groups" className={panel.headerLink}>
              View all
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col">
            {loading ? (
              <SkeletonRows count={3} />
            ) : groups.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No groups yet"
                text="Groups keep expenses for a trip, flat or team together."
              />
            ) : (
              groups.slice(0, 5).map((group) => {
                const info = summary.byGroup[group.id];
                const net = info?.myNet || 0;
                return (
                  <Link href={`/client/groups/${group.id}`} className={page.groupCard} key={group.id}>
                    <div className={cx(page.groupCardAvatar, toneClass[toneFor(group.id)])}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>

                    <div className={page.groupCardInfo}>
                      <strong>{group.name}</strong>
                      <span>
                        <Users size={12} />
                        {info?.members.length || 0} members
                      </span>
                    </div>

                    <div
                      className={cx(
                        page.groupBalance,
                        net > 0 ? "text-payo-green" : net < 0 ? "text-payo-red" : "!font-semibold text-payo-light"
                      )}
                    >
                      {net === 0 ? "Settled" : formatCents(net, group.currency, { sign: true })}
                    </div>

                    <ChevronRight className={page.chevron} size={15} />
                  </Link>
                );
              })
            )}
          </div>

          <button type="button" className={page.newGroup} onClick={() => openGroupModal("create")}>
            <Plus size={15} />
            Create new group
          </button>
        </div>
      </section>
    </>
  );
}
