"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Activity as ActivityIcon, HandCoins, UserPlus, type LucideIcon } from "lucide-react";

import { useWorkspace } from "@/components/dashboard/Workspace";
import { EmptyState, ErrorBanner, PageHeader, SkeletonRows, page } from "@/components/dashboard/DashboardParts";
import { cx, form, panel, toneClass } from "@/components/ui/classes";
import { categoryFor, friendlyDate } from "@/lib/format";
import { expenseImpact } from "@/lib/balances";
import { formatCents, toCents } from "@/lib/money";

type Kind = "expense" | "payment" | "member";

const FILTERS: { value: "all" | Kind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "payment", label: "Payments" },
  { value: "member", label: "Members" },
];

interface ActivityItem {
  id: string;
  kind: Kind;
  at: string;
  groupId: string;
  icon: LucideIcon;
  tone?: keyof typeof toneClass;
  text: ReactNode;
  amount?: string;
  detail?: { text: string; cls: string } | null;
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const groupLink =
  "border-b border-[#d7ecdf] font-bold text-payo-ink no-underline hover:text-payo-green-dark";

export default function ActivityPage() {
  const { groups, members, expenses, settlements, loading, error, refresh, userId, memberName } = useWorkspace();
  const [filter, setFilter] = useState<"all" | Kind>("all");

  const items = useMemo(() => {
    const groupName = (id: string) => groups.find((g) => g.id === id)?.name || "a group";
    const list: ActivityItem[] = [];

    expenses.forEach((e) => {
      const impact = expenseImpact(e, userId);
      list.push({
        id: `e-${e.id}`,
        kind: "expense",
        at: e.created_at,
        groupId: e.group_id,
        icon: categoryFor(e.category).icon,
        text: (
          <>
            <b>{memberName(e.created_by || e.paid_by)}</b> added <b>“{e.description}”</b> in{" "}
            <Link href={`/client/groups/${e.group_id}`} className={groupLink}>
              {groupName(e.group_id)}
            </Link>
          </>
        ),
        amount: formatCents(toCents(e.amount)),
        detail:
          impact > 0
            ? { text: `you lent ${formatCents(impact)}`, cls: page.positive }
            : impact < 0
              ? { text: `you owe ${formatCents(-impact)}`, cls: page.negative }
              : { text: "not involved", cls: "" },
      });
    });

    settlements.forEach((s) => {
      list.push({
        id: `s-${s.id}`,
        kind: "payment",
        at: s.created_at,
        groupId: s.group_id,
        icon: HandCoins,
        tone: "green",
        text: (
          <>
            <b>{memberName(s.from_user)}</b> paid <b>{memberName(s.to_user)}</b> in{" "}
            <Link href={`/client/groups/${s.group_id}`} className={groupLink}>
              {groupName(s.group_id)}
            </Link>
          </>
        ),
        amount: formatCents(toCents(s.amount)),
        detail:
          s.to_user === userId
            ? { text: "you received", cls: page.positive }
            : s.from_user === userId
              ? { text: "you paid", cls: "" }
              : null,
      });
    });

    members.forEach((m) => {
      list.push({
        id: `m-${m.group_id}-${m.user_id}`,
        kind: "member",
        at: m.joined_at || "",
        groupId: m.group_id,
        icon: UserPlus,
        tone: "blue",
        text: (
          <>
            <b>{memberName(m.user_id)}</b> {m.role === "owner" ? "created" : "joined"}{" "}
            <Link href={`/client/groups/${m.group_id}`} className={groupLink}>
              {groupName(m.group_id)}
            </Link>
          </>
        ),
      });
    });

    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [expenses, settlements, members, groups, userId, memberName]);

  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);

  // Group by day
  const days: { label: string; items: ActivityItem[] }[] = [];
  visible.forEach((item) => {
    const label = friendlyDate(item.at);
    const last = days[days.length - 1];
    if (last && last.label === label) last.items.push(item);
    else days.push({ label, items: [item] });
  });

  return (
    <>
      <PageHeader
        eyebrow="ACTIVITY"
        title={
          <>
            Recent <strong>activity.</strong>
          </>
        }
        description="Everything that happened across your groups."
      />

      <ErrorBanner message={error} onRetry={refresh} />

      <section className={panel.panelVisible}>
        <div className={page.toolbar}>
          <div className={form.segment}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={cx(form.segmentBtn, filter === f.value && form.segmentBtnActive)}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonRows count={6} />
        ) : visible.length === 0 ? (
          <EmptyState icon={ActivityIcon} title="Nothing here yet" text="Activity from your groups will show up here." />
        ) : (
          days.map((day, dayIndex) => (
            <div key={day.label}>
              <div className={page.monthLabel}>
                <span>{day.label}</span>
              </div>
              <ul className="m-0 list-none p-0">
                {day.items.map((item, i) => {
                  const Icon = item.icon;
                  const lastOverall = dayIndex === days.length - 1 && i === day.items.length - 1;
                  return (
                    <li
                      key={item.id}
                      className={cx(
                        "flex items-center gap-3 px-[19px] py-3 max-[760px]:px-[15px]",
                        !lastOverall && "border-b border-payo-border-soft"
                      )}
                    >
                      <span
                        className={cx(
                          "flex size-[33px] flex-[0_0_33px] items-center justify-center rounded-lg bg-[#f5f6f4] text-payo-muted",
                          item.tone && toneClass[item.tone]
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[13px] leading-[1.45] text-payo-muted [&_b]:font-bold [&_b]:text-payo-text">
                          {item.text}
                        </p>
                        <span className="mt-[3px] block text-[11.5px] font-medium text-payo-light">
                          {timeOf(item.at)}
                          {item.detail && (
                            <>
                              {" · "}
                              <em className={cx("font-bold not-italic", item.detail.cls)}>{item.detail.text}</em>
                            </>
                          )}
                        </span>
                      </div>
                      {item.amount && (
                        <strong className="text-[13px] font-[750] whitespace-nowrap text-payo-text">{item.amount}</strong>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
