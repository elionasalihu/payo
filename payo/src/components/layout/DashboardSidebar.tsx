"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { LayoutDashboard, LogOut, Plus, Settings, Shield, type LucideIcon } from "lucide-react";

import NavLink from "../ui/NavLink";
import { cx, toneClass } from "../ui/classes";
import { useAuth } from "../providers/AuthProvider";
import { InstallAppButton } from "../pwa/PwaUI";
import { initials, toneFor } from "@/lib/format";

export interface NavItem {
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
}

export interface SidebarGroup {
  id: string;
  name: string;
  memberCount: number;
}

const logo = "inline-flex items-baseline font-display text-[21px] leading-none font-semibold tracking-[-0.055em] text-payo-ink no-underline";
const sectionLabel = "mx-2.5 mb-[9px] block text-xs font-extrabold tracking-[0.08em] text-payo-light uppercase";
const bottomLink = (active = false) =>
  cx(
    "flex h-10 w-full items-center gap-[11px] rounded-lg px-2.5 text-left text-[13px] font-semibold no-underline transition-[color,background] duration-[180ms] hover:bg-[#f7f8f6] hover:text-payo-ink",
    active ? "bg-[#eef9f3] text-payo-ink" : "text-payo-muted"
  );
const profileAvatar =
  "flex size-8 flex-[0_0_32px] items-center justify-center rounded-lg bg-payo-ink text-[11.5px] font-extrabold text-white no-underline";
const mobileIcon = "flex size-[34px] items-center justify-center rounded-lg bg-[#f5f6f4] text-[#475467]";

function Wordmark({ to }: { to: string }) {
  return (
    <Link href={to} className={logo} aria-label="Payo dashboard">
      <span>
        <span>pay</span>
        <span className="font-bold text-payo-green">o</span>
        <span>.</span>
      </span>
    </Link>
  );
}

// Sidebar used by both the client and the admin area
export default function DashboardSidebar({
  navigation,
  groups = [],
  onAdd,
  addLabel = "Add expense",
  variant = "client",
  homeTo = "/client",
}: {
  navigation: NavItem[];
  groups?: SidebarGroup[];
  onAdd?: () => void;
  addLabel?: string;
  variant?: "client" | "admin";
  homeTo?: string;
}) {
  const { profile, user, isAdmin, signOut } = useAuth();

  const name = profile?.full_name || user?.email || "";
  const email = profile?.email || user?.email || "";

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="fixed top-0 left-0 z-[100] flex h-screen w-[250px] flex-col border-r border-payo-border bg-white font-sans max-[900px]:w-[220px] max-[760px]:hidden">
        <div className="flex h-[76px] items-center justify-between border-b border-payo-border-soft px-[22px]">
          <Wordmark to={homeTo} />
          {variant === "admin" && (
            <span className="rounded-md bg-payo-green-soft px-2 py-1 text-[10.5px] font-extrabold tracking-[0.06em] text-payo-green-dark uppercase">
              Admin
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-[26px]">
          <div>
            <span className={sectionLabel}>{variant === "admin" ? "Administration" : "Workspace"}</span>

            <nav className="flex flex-col gap-[3px]">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    href={item.to}
                    end={item.end}
                    className={(isActive) =>
                      cx(
                        "relative flex h-[42px] items-center gap-[11px] rounded-lg px-[11px] text-[13px] font-semibold no-underline transition-[color,background] duration-[180ms] hover:bg-[#f7f8f6] hover:text-payo-ink",
                        isActive ? "!bg-[#eef9f3] text-payo-ink [&>svg]:text-payo-green" : "text-payo-muted"
                      )
                    }
                  >
                    {(isActive) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId={`${variant}-active-indicator`}
                            className="absolute left-0 h-[18px] w-[3px] rounded-[0_3px_3px_0] bg-payo-green"
                          />
                        )}
                        <Icon size={17} strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {onAdd && (
            <button
              type="button"
              className="mt-[25px] mb-[29px] flex h-[43px] w-full items-center gap-2.5 rounded-lg bg-payo-ink px-2.5 text-left text-[13px] font-bold text-white transition-[background,transform] duration-[180ms] hover:-translate-y-px hover:bg-[#1d2636]"
              onClick={onAdd}
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-payo-green">
                <Plus size={16} strokeWidth={2.2} />
              </span>
              <span>{addLabel}</span>
            </button>
          )}

          {variant === "client" && (
            <div>
              <span className={sectionLabel}>Your groups</span>

              <div className="flex flex-col gap-[3px]">
                {groups.length === 0 && (
                  <p className="mx-2.5 my-0 text-[12.5px] leading-normal font-medium text-payo-light">
                    No groups yet. Create one to start splitting.
                  </p>
                )}

                {groups.slice(0, 6).map((group) => (
                  <NavLink
                    key={group.id}
                    href={`/client/groups/${group.id}`}
                    className={(isActive) =>
                      cx(
                        "flex min-h-[47px] items-center gap-2.5 rounded-lg px-2 py-[5px] no-underline transition-[background] duration-[180ms] hover:bg-[#f7f8f6]",
                        isActive && "!bg-[#eef9f3]"
                      )
                    }
                  >
                    <span
                      className={cx(
                        "flex size-[29px] flex-[0_0_29px] items-center justify-center rounded-[7px] bg-[#f0f2ef] text-[12.5px] font-extrabold text-[#475467]",
                        toneClass[toneFor(group.id)]
                      )}
                    >
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <strong className="truncate text-[12.5px] font-bold text-[#344054]">{group.name}</strong>
                      <small className="text-[11.5px] font-medium text-payo-light">
                        {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                      </small>
                    </span>
                  </NavLink>
                ))}

                {groups.length > 6 && (
                  <Link
                    href="/client/groups"
                    className="block px-2.5 py-2 text-[12.5px] font-bold text-payo-muted no-underline hover:text-payo-green-dark"
                  >
                    View all {groups.length} groups
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-payo-border-soft p-3.5">
          <InstallAppButton className={bottomLink()} />
          {variant === "client" ? (
            <>
              {isAdmin && (
                <Link href="/admin" className={bottomLink()}>
                  <Shield size={17} strokeWidth={1.8} />
                  <span>Admin panel</span>
                </Link>
              )}
              <NavLink href="/client/settings" className={(isActive) => bottomLink(isActive)}>
                <Settings size={17} strokeWidth={1.8} />
                <span>Settings</span>
              </NavLink>
            </>
          ) : (
            <Link href="/client" className={bottomLink()}>
              <LayoutDashboard size={17} strokeWidth={1.8} />
              <span>Back to app</span>
            </Link>
          )}

          <div className="mt-2 flex items-center gap-2.5 border-t border-payo-border-soft px-2 py-2.5">
            <div className={profileAvatar}>{initials(name)}</div>

            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <strong className="truncate text-xs font-bold text-[#344054]">{name}</strong>
              <span className="truncate text-[11.5px] font-medium text-payo-light">{email}</span>
            </div>

            <button
              type="button"
              className="flex size-[30px] flex-[0_0_30px] items-center justify-center rounded-[7px] text-payo-light transition-[color,background] duration-[160ms] hover:bg-payo-red-soft hover:text-[#b84343]"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-[900] hidden h-[58px] items-center justify-between border-b border-payo-border bg-white/94 px-4 backdrop-blur-[16px] max-[760px]:flex standalone:h-[calc(58px+env(safe-area-inset-top))] standalone:pt-[env(safe-area-inset-top)]">
        <Wordmark to={homeTo} />
        <div className="flex items-center gap-2">
          <InstallAppButton className={mobileIcon} compact />
          {variant === "client" && isAdmin && (
            <Link href="/admin" className={mobileIcon} aria-label="Admin panel">
              <Shield size={18} />
            </Link>
          )}
          {variant === "admin" && (
            <Link href="/client" className={mobileIcon} aria-label="Back to app">
              <LayoutDashboard size={18} />
            </Link>
          )}
          <Link href="/client/settings" className={profileAvatar} aria-label="Settings">
            {initials(name)}
          </Link>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-[1000] hidden h-[68px] w-full items-center justify-around gap-0.5 border-t border-payo-border bg-white/96 px-3 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-[16px] max-[760px]:flex">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              href={item.to}
              end={item.end}
              className={(isActive) =>
                cx(
                  "relative flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[10px] text-[11.5px] font-semibold no-underline transition-[color,background] duration-[180ms]",
                  isActive
                    ? "text-payo-green before:absolute before:top-0 before:h-0.5 before:w-5 before:rounded-[0_0_3px_3px] before:bg-payo-green before:content-['']"
                    : "text-payo-light"
                )
              }
            >
              {(isActive) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.7} />
                  <span>{item.mobileLabel || item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {onAdd && (
          <button
            type="button"
            className="flex size-[42px] items-center justify-center rounded-[11px] bg-payo-ink text-white shadow-[0_4px_12px_rgba(17,24,39,0.14)] transition-[transform,background] duration-[180ms] hover:-translate-y-0.5 hover:bg-[#1d2636]"
            onClick={onAdd}
            aria-label={addLabel}
          >
            <Plus size={20} strokeWidth={2.2} />
          </button>
        )}
      </nav>
    </>
  );
}
