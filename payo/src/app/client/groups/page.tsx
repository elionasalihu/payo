"use client";

import Link from "next/link";
import { ChevronRight, LogIn, Plus, Users } from "lucide-react";

import { useWorkspace } from "@/components/dashboard/Workspace";
import {
  AvatarStack,
  EmptyState,
  ErrorBanner,
  PageHeader,
  SkeletonRows,
  page,
} from "@/components/dashboard/DashboardParts";
import { btn, cx, panel, toneClass, btnSm } from "@/components/ui/classes";
import { initials, toneFor } from "@/lib/format";
import { formatCents } from "@/lib/money";

export default function GroupsPage() {
  const { groups, summary, loading, error, refresh, userId, openGroupModal } = useWorkspace();

  return (
    <>
      <PageHeader
        eyebrow="GROUPS"
        title={
          <>
            Your <strong>groups.</strong>
          </>
        }
        description="Trips, flats, teams — every shared space in one place."
        actions={
          <>
            <button type="button" className={btn.ghost} onClick={() => openGroupModal("join")}>
              <LogIn size={15} />
              <span className={page.hideSm}>Join with code</span>
            </button>
            <button type="button" className={page.headerAdd} onClick={() => openGroupModal("create")}>
              <Plus size={16} />
              New group
            </button>
          </>
        }
      />

      <ErrorBanner message={error} onRetry={refresh} />

      {loading ? (
        <div className={panel.panelVisible}>
          <SkeletonRows count={4} />
        </div>
      ) : groups.length === 0 ? (
        <div className={panel.panelVisible}>
          <EmptyState
            icon={Users}
            title="You’re not in any groups yet"
            text="Create a group and invite friends, or join an existing one with its invite code."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" className={btnSm.primary} onClick={() => openGroupModal("create")}>
                  <Plus size={14} /> Create group
                </button>
                <button type="button" className={btnSm.ghost} onClick={() => openGroupModal("join")}>
                  <LogIn size={14} /> Join with code
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {groups.map((group) => {
            const info = summary.byGroup[group.id];
            const net = info?.myNet || 0;
            const others = info?.members || [];
            const owner = others.find((m) => m.role === "owner");
            return (
              <Link
                key={group.id}
                href={`/client/groups/${group.id}`}
                className="flex flex-col rounded-[14px] border border-payo-border bg-white p-[18px] text-inherit no-underline transition-[border-color,transform,box-shadow] duration-[180ms] hover:-translate-y-0.5 hover:border-[#cfe9da] hover:shadow-[0_10px_26px_rgba(17,24,39,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cx(
                      "flex size-10 items-center justify-center rounded-[10px] text-[15px] font-extrabold",
                      toneClass[toneFor(group.id)]
                    )}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </span>
                  <ChevronRight size={16} className={page.chevron} />
                </div>

                <strong className="mt-3.5 text-base font-bold tracking-[-0.02em]">{group.name}</strong>
                <p className="mt-[5px] mb-3.5 line-clamp-2 text-[13px] leading-[1.45] text-payo-muted">
                  {group.description ||
                    (owner?.user_id === userId
                      ? "You created this group"
                      : `Created by ${owner?.profile?.full_name || "a member"}`)}
                </p>

                <AvatarStack
                  names={others.map((m) => ({
                    key: m.user_id,
                    label: initials(m.profile?.full_name || m.profile?.email),
                    title: m.profile?.full_name,
                  }))}
                />

                <div className="mt-auto flex justify-between gap-3 border-t border-payo-border-soft pt-3.5 [&_span]:block [&_span]:text-[11px] [&_span]:font-semibold [&_span]:text-payo-light [&_strong]:mt-1 [&_strong]:block [&_strong]:text-[15px] [&_strong]:font-bold">
                  <div>
                    <span>Total spent</span>
                    <strong>{formatCents(info?.totalCents || 0, group.currency)}</strong>
                  </div>
                  <div className="text-right">
                    <span>{net > 0 ? "You are owed" : net < 0 ? "You owe" : "Your balance"}</span>
                    <strong className={net > 0 ? page.positive : net < 0 ? page.negative : ""}>
                      {net === 0 ? "Settled" : formatCents(Math.abs(net), group.currency)}
                    </strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </>
  );
}
