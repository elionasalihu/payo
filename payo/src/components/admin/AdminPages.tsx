"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, Search, Shield, ShieldOff, Trash2, Users, UsersRound, Wallet } from "lucide-react";

import { useAdminData } from "../dashboard/AdminShell";
import { useAuth } from "../providers/AuthProvider";
import { useToast } from "../providers/ToastProvider";
import { useConfirm } from "../providers/ConfirmProvider";
import { EmptyState, ErrorBanner, PageHeader, SkeletonRows, chart, page } from "../dashboard/DashboardParts";
import { avatar, badge, cx, form, iconBtn, panel, toneClass, btnSm } from "../ui/classes";
import { adminSetRole, deleteExpense, deleteGroup } from "@/lib/supabase/api";
import { categoryFor, friendlyDate, initials, toneFor } from "@/lib/format";
import { formatCents, toCents } from "@/lib/money";
import type { Expense, Group, Profile } from "@/lib/types";

const sumCents = (list: Pick<Expense, "amount">[]) => list.reduce((s, e) => s + toCents(e.amount), 0);

/* Table styles (admin pages only) */
const table = {
  wrap: "overflow-x-auto",
  table: "w-full border-collapse text-[13px]",
  th: "border-b border-payo-border-soft bg-[#fafbfa] px-[19px] py-[11px] text-left text-[11px] font-extrabold tracking-[0.06em] whitespace-nowrap text-payo-muted uppercase max-[760px]:px-[15px] max-[760px]:py-2.5",
  tr: "hover:bg-[#fcfdfc] [&:last-child>td]:border-b-0",
  td: "border-b border-payo-border-soft px-[19px] py-[11px] align-middle font-semibold whitespace-nowrap text-payo-text max-[760px]:px-[15px] max-[760px]:py-2.5",
  num: "!text-right tabular-nums",
  strong: "font-extrabold !text-payo-ink",
  muted: "font-medium !text-payo-muted",
  actions: "w-[1%] text-right",
  cellUser: "flex min-w-[200px] items-center gap-2.5",
  cellName: "flex items-center gap-1.5 font-bold text-payo-ink",
  cellSub: "mt-0.5 block text-xs font-medium text-payo-light",
  you: "rounded-[5px] bg-[#f2f3f1] px-1.5 py-px text-[10px] font-bold text-payo-muted",
};

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className={page.search}>
      <Search size={15} />
      <input
        className={page.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </label>
  );
}

// Overview

export function AdminOverview() {
  const { profiles, groups, members, expenses, settlements, loading, error, refresh, nameOf } = useAdminData();

  const months = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const totals: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
    expenses.forEach((e) => {
      const k = e.expense_date.slice(0, 7);
      if (k in totals) totals[k] += toCents(e.amount);
    });
    const max = Math.max(1, ...Object.values(totals));
    return keys.map((k) => ({
      key: k,
      label: new Date(`${k}-01T00:00:00`).toLocaleDateString("en-US", { month: "short" }),
      cents: totals[k],
      pct: (totals[k] / max) * 100,
    }));
  }, [expenses]);

  const topGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          total: sumCents(expenses.filter((e) => e.group_id === g.id)),
          memberCount: members.filter((m) => m.group_id === g.id).length,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    [groups, expenses, members]
  );

  // Read the clock once per mount (render functions must stay pure).
  const [now] = useState(() => Date.now());
  const newUsers30 = profiles.filter(
    (p) => p.created_at && now - new Date(p.created_at).getTime() < 30 * 86400000
  ).length;

  const stats = [
    { label: "Users", value: profiles.length, sub: `${newUsers30} joined in the last 30 days`, icon: UsersRound },
    { label: "Groups", value: groups.length, sub: `${members.length} memberships`, icon: Users },
    { label: "Expenses", value: expenses.length, sub: `${settlements.length} payments recorded`, icon: CreditCard },
    { label: "Total volume", value: formatCents(sumCents(expenses)), sub: "All expenses ever added", icon: Wallet },
  ];

  return (
    <>
      <PageHeader
        eyebrow="ADMIN"
        title={
          <>
            Platform <strong>overview.</strong>
          </>
        }
        description="How Payo is being used across all accounts."
      />

      <ErrorBanner message={error} onRetry={refresh} />

      <section className={chart.stats}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cx(page.balanceCard, chart.statCard)}>
              <div className={page.cardTop}>
                <span>{s.label}</span>
                <div className={page.cardIcon}>
                  <Icon size={17} />
                </div>
              </div>
              <div className={page.smallValue}>{loading ? "—" : s.value}</div>
              <p className={page.cardDescription}>{s.sub}</p>
            </div>
          );
        })}
      </section>

      <section className={page.contentGrid}>
        <div className={panel.panel}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>Expense volume</h2>
              <p className={panel.subtitle}>Last 6 months, by expense date</p>
            </div>
          </div>
          <div className={chart.wrap} role="img" aria-label="Expense volume per month">
            {months.map((m, i) => (
              <div key={m.key} className={chart.col}>
                <span className={chart.value}>{m.cents ? formatCents(m.cents).replace(/\.\d\d$/, "") : ""}</span>
                <div className={chart.track}>
                  <div
                    className={cx(chart.bar, i === months.length - 1 && "!bg-payo-ink")}
                    style={{ height: `${Math.max(m.pct, m.cents ? 4 : 0)}%` }}
                  />
                </div>
                <span className={chart.label}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          <div className={panel.panel}>
            <div className={panel.header}>
              <div>
                <h2 className={panel.title}>Top groups</h2>
                <p className={panel.subtitle}>By total spent</p>
              </div>
              <Link href="/admin/groups" className={panel.headerLink}>
                View all
              </Link>
            </div>
            <div className="flex flex-col">
              {loading ? (
                <SkeletonRows count={3} />
              ) : topGroups.length === 0 ? (
                <EmptyState icon={Users} title="No groups yet" />
              ) : (
                topGroups.map((g) => (
                  <div key={g.id} className={cx(page.groupCard, "hover:!bg-transparent")}>
                    <div className={cx(page.groupCardAvatar, toneClass[toneFor(g.id)])}>
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={page.groupCardInfo}>
                      <strong>{g.name}</strong>
                      <span>{g.memberCount} members</span>
                    </div>
                    <div className={page.groupBalance}>{formatCents(g.total)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={panel.panel}>
            <div className={panel.header}>
              <div>
                <h2 className={panel.title}>Newest users</h2>
                <p className={panel.subtitle}>Latest sign-ups</p>
              </div>
              <Link href="/admin/users" className={panel.headerLink}>
                View all
              </Link>
            </div>
            <div className="flex flex-col">
              {profiles.slice(0, 5).map((p) => (
                <div key={p.id} className={cx(page.groupCard, "hover:!bg-transparent")}>
                  <div className={page.groupCardAvatar}>{initials(p.full_name || p.email)}</div>
                  <div className={page.groupCardInfo}>
                    <strong>{nameOf(p.id)}</strong>
                    <span>{p.email}</span>
                  </div>
                  <div className={cx(page.groupBalance, "!font-semibold text-payo-light")}>
                    {friendlyDate(p.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Users

export function AdminUsers() {
  const { profiles, members, expenses, loading, error, refresh } = useAdminData();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles
      .filter((p) => roleFilter === "all" || p.role === roleFilter)
      .filter((p) => !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
      .map((p) => ({
        ...p,
        groupCount: members.filter((m) => m.user_id === p.id).length,
        paidCents: sumCents(expenses.filter((e) => e.paid_by === p.id)),
      }));
  }, [profiles, members, expenses, query, roleFilter]);

  // The protect_profile_role trigger in the database rejects this for non-admins
  // and for changing your own role.
  const toggleRole = async (p: Profile) => {
    const next = p.role === "admin" ? "user" : "admin";
    const ok = await confirm({
      title: next === "admin" ? `Make ${p.full_name} an admin?` : `Remove admin from ${p.full_name}?`,
      message:
        next === "admin"
          ? "Admins can see every user, group and expense, and delete content."
          : "They will lose access to the admin panel.",
      confirmLabel: next === "admin" ? "Make admin" : "Remove admin",
      danger: next !== "admin",
    });
    if (!ok) return;
    try {
      await adminSetRole(p.id, next);
      toast.success(`${p.full_name} is now ${next === "admin" ? "an admin" : "a regular user"}`);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="ADMIN"
        title={
          <>
            All <strong>users.</strong>
          </>
        }
        description={`${profiles.length} registered accounts`}
      />
      <ErrorBanner message={error} onRetry={refresh} />

      <section className={panel.panelVisible}>
        <div className={page.toolbar}>
          <SearchBox value={query} onChange={setQuery} placeholder="Search by name or email" />
          <select
            className={cx(form.select, page.filter)}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {loading ? (
          <SkeletonRows count={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={UsersRound} title="No users found" />
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>User</th>
                  <th className={table.th}>Role</th>
                  <th className={cx(table.th, table.num)}>Groups</th>
                  <th className={cx(table.th, table.num)}>Paid</th>
                  <th className={table.th}>Joined</th>
                  <th className={table.th} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={table.tr}>
                    <td className={table.td}>
                      <div className={table.cellUser}>
                        <span className={avatar}>{initials(p.full_name || p.email)}</span>
                        <div>
                          <strong className={table.cellName}>
                            {p.full_name}
                            {p.id === user?.id && <span className={table.you}>you</span>}
                          </strong>
                          <span className={table.cellSub}>{p.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={table.td}>
                      <span className={p.role === "admin" ? badge.green : badge.muted}>
                        {p.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className={cx(table.td, table.num)}>{p.groupCount}</td>
                    <td className={cx(table.td, table.num)}>{formatCents(p.paidCents)}</td>
                    <td className={cx(table.td, table.muted)}>{friendlyDate(p.created_at)}</td>
                    <td className={cx(table.td, table.actions)}>
                      {p.id !== user?.id && (
                        <button type="button" className={btnSm.ghost} onClick={() => toggleRole(p)}>
                          {p.role === "admin" ? <ShieldOff size={14} /> : <Shield size={14} />}
                          {p.role === "admin" ? "Remove admin" : "Make admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// Groups

export function AdminGroups() {
  const { groups, members, expenses, loading, error, refresh, nameOf } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .map((g) => {
        const gm = members.filter((m) => m.group_id === g.id);
        const ge = expenses.filter((e) => e.group_id === g.id);
        return {
          ...g,
          memberCount: gm.length,
          owner: gm.find((m) => m.role === "owner")?.user_id,
          expenseCount: ge.length,
          total: sumCents(ge),
        };
      });
  }, [groups, members, expenses, query]);

  const remove = async (g: Group & { memberCount: number; expenseCount: number }) => {
    const ok = await confirm({
      title: `Delete “${g.name}”?`,
      message: `This permanently removes the group, its ${g.memberCount} memberships and ${g.expenseCount} expenses.`,
      confirmLabel: "Delete group",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteGroup(g.id);
      toast.success("Group deleted");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="ADMIN"
        title={
          <>
            All <strong>groups.</strong>
          </>
        }
        description={`${groups.length} groups on Payo`}
      />
      <ErrorBanner message={error} onRetry={refresh} />

      <section className={panel.panelVisible}>
        <div className={page.toolbar}>
          <SearchBox value={query} onChange={setQuery} placeholder="Search groups" />
        </div>

        {loading ? (
          <SkeletonRows count={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No groups found" />
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Group</th>
                  <th className={table.th}>Owner</th>
                  <th className={cx(table.th, table.num)}>Members</th>
                  <th className={cx(table.th, table.num)}>Expenses</th>
                  <th className={cx(table.th, table.num)}>Total</th>
                  <th className={table.th}>Created</th>
                  <th className={table.th} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id} className={table.tr}>
                    <td className={table.td}>
                      <div className={table.cellUser}>
                        <span className={cx(avatar, toneClass[toneFor(g.id)])}>{g.name.charAt(0).toUpperCase()}</span>
                        <div>
                          <strong className={table.cellName}>{g.name}</strong>
                          <span className={table.cellSub}>Code {g.invite_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className={cx(table.td, table.muted)}>{g.owner ? nameOf(g.owner) : "—"}</td>
                    <td className={cx(table.td, table.num)}>{g.memberCount}</td>
                    <td className={cx(table.td, table.num)}>{g.expenseCount}</td>
                    <td className={cx(table.td, table.num)}>{formatCents(g.total, g.currency)}</td>
                    <td className={cx(table.td, table.muted)}>{friendlyDate(g.created_at)}</td>
                    <td className={cx(table.td, table.actions)}>
                      <button type="button" className={cx(iconBtn, "ml-auto")} onClick={() => remove(g)} aria-label={`Delete ${g.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// Expenses

export function AdminExpenses() {
  const { expenses, groups, groupById, loading, error, refresh, nameOf } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(
      (e) => (groupFilter === "all" || e.group_id === groupFilter) && (!q || e.description.toLowerCase().includes(q))
    );
  }, [expenses, query, groupFilter]);

  const remove = async (e: Expense) => {
    const ok = await confirm({
      title: "Delete expense?",
      message: `“${e.description}” (${formatCents(toCents(e.amount))}) will be removed and balances in “${groupById[e.group_id]?.name}” will update.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteExpense(e.id);
      toast.success("Expense deleted");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="ADMIN"
        title={
          <>
            All <strong>expenses.</strong>
          </>
        }
        description={`${rows.length} expenses · ${formatCents(sumCents(rows))}`}
      />
      <ErrorBanner message={error} onRetry={refresh} />

      <section className={panel.panelVisible}>
        <div className={page.toolbar}>
          <SearchBox value={query} onChange={setQuery} placeholder="Search expenses" />
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
        </div>

        {loading ? (
          <SkeletonRows count={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={CreditCard} title="No expenses found" />
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Expense</th>
                  <th className={table.th}>Group</th>
                  <th className={table.th}>Paid by</th>
                  <th className={cx(table.th, table.num)}>Split</th>
                  <th className={cx(table.th, table.num)}>Amount</th>
                  <th className={table.th}>Date</th>
                  <th className={table.th} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const cat = categoryFor(e.category);
                  const Icon = cat.icon;
                  return (
                    <tr key={e.id} className={table.tr}>
                      <td className={table.td}>
                        <div className={table.cellUser}>
                          <span className={avatar}>
                            <Icon size={14} />
                          </span>
                          <div>
                            <strong className={table.cellName}>{e.description}</strong>
                            <span className={table.cellSub}>{cat.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className={cx(table.td, table.muted)}>{groupById[e.group_id]?.name || "—"}</td>
                      <td className={cx(table.td, table.muted)}>{nameOf(e.paid_by)}</td>
                      <td className={cx(table.td, table.num)}>{(e.splits || []).length} people</td>
                      <td className={cx(table.td, table.num, table.strong)}>{formatCents(toCents(e.amount))}</td>
                      <td className={cx(table.td, table.muted)}>{friendlyDate(e.expense_date)}</td>
                      <td className={cx(table.td, table.actions)}>
                        <button
                          type="button"
                          className={cx(iconBtn, "ml-auto")}
                          onClick={() => remove(e)}
                          aria-label={`Delete ${e.description}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
