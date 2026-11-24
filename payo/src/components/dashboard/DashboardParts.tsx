"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, MoreHorizontal, type LucideIcon } from "lucide-react";

import { cx, btnSm } from "../ui/classes";
import { categoryFor, friendlyDate } from "@/lib/format";
import { expenseImpact } from "@/lib/balances";
import { formatCents, formatMoney } from "@/lib/money";
import type { Expense } from "@/lib/types";

/** Shared layout classes for client and admin pages. */
export const page = {
  /** Every direct child of <main> is centered at max 1280px. */
  main: "min-h-screen ml-[250px] px-[42px] pt-[42px] pb-[60px] max-[900px]:ml-[220px] max-[900px]:px-[26px] max-[900px]:pt-8 max-[900px]:pb-[50px] max-[760px]:ml-0 max-[760px]:px-4 max-[760px]:pt-[27px] max-[760px]:pb-[95px] [&>*]:mx-auto [&>*]:max-w-[1280px]",
  /** Dark "Add expense" style button used in page headers (icon-only on phones). */
  headerAdd:
    "inline-flex min-h-[41px] items-center justify-center gap-2 rounded-lg bg-payo-ink px-[15px] font-sans text-[12.5px] font-bold text-white transition-[background,transform] duration-[180ms] hover:-translate-y-px hover:bg-[#1d2636] max-[760px]:size-[41px] max-[760px]:rounded-[9px] max-[760px]:p-0 max-[760px]:text-[0px]",
  /** Two-column content grid (main + side). */
  contentGrid:
    "mx-auto grid max-w-[1280px] grid-cols-[1.55fr_1fr] items-start gap-3.5 max-[1100px]:grid-cols-1 max-[760px]:gap-3",
  balanceGrid:
    "mx-auto mb-6 grid max-w-[1280px] grid-cols-[1.5fr_1fr_1fr] gap-3.5 max-[760px]:grid-cols-2 max-[760px]:gap-2.5 max-[430px]:gap-2",
  balanceCard:
    "min-h-[145px] rounded-xl border border-payo-border bg-white p-[19px] max-[760px]:min-h-[130px] max-[760px]:p-[15px] max-[430px]:p-3.5",
  balanceMain: "!border-payo-ink !bg-payo-ink text-white max-[760px]:col-span-full",
  cardTop: "flex items-center justify-between text-xs font-bold text-payo-muted",
  cardTopDark: "flex items-center justify-between text-xs font-bold text-payo-light",
  cardIcon: "flex size-[30px] items-center justify-center rounded-[7px] bg-[#f5f6f4] text-payo-muted",
  cardIconGreen: "flex size-[30px] items-center justify-center rounded-[7px] bg-payo-green-soft text-payo-green",
  cardIconRed: "flex size-[30px] items-center justify-center rounded-[7px] bg-payo-red-soft text-payo-red",
  balanceValue: "mt-[22px] text-[32px] leading-none font-semibold tracking-[-0.05em] max-[760px]:text-[29px]",
  smallValue:
    "mt-[25px] text-[25px] leading-none font-semibold tracking-[-0.045em] text-payo-ink max-[760px]:mt-[22px] max-[760px]:text-[21px]",
  cardDescription: "mt-[9px] mb-0 text-[11.5px] font-medium text-payo-light",
  balanceFooter: "mt-3 flex items-center gap-[7px] text-[11.5px] font-medium text-payo-light",
  positive: "text-payo-green",
  negative: "text-payo-red",
  negativeLight: "inline-flex items-center gap-[3px] text-[#f19a9a]",
  /** Stats strip (3 white tiles). */
  stats:
    "mb-3.5 grid grid-cols-3 gap-3.5 max-[760px]:grid-cols-2 max-[760px]:gap-2.5 [&>div]:rounded-xl [&>div]:border [&>div]:border-payo-border [&>div]:bg-white [&>div]:px-[19px] [&>div]:py-4 max-[760px]:[&>div:first-child]:col-span-full [&_span]:block [&_span]:text-xs [&_span]:font-bold [&_span]:text-payo-muted [&_strong]:mt-2 [&_strong]:block [&_strong]:text-[22px] [&_strong]:font-semibold [&_strong]:tracking-[-0.04em]",
  toolbar:
    "flex flex-wrap items-center gap-2.5 border-b border-payo-border-soft px-[19px] py-3.5 max-[760px]:px-[15px] max-[760px]:py-3",
  search:
    "flex h-10 flex-[1_1_220px] items-center gap-2 rounded-[10px] border border-payo-border bg-white px-3 text-payo-light focus-within:border-payo-green focus-within:shadow-[0_0_0_3px_rgba(32,184,107,0.14)]",
  searchInput: "h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium text-payo-ink outline-none",
  filter: "!h-10 !w-auto flex-[0_1_180px] !text-[13px] max-[760px]:flex-[1_1_140px]",
  check: "inline-flex cursor-pointer items-center gap-[7px] text-[13px] font-semibold whitespace-nowrap text-payo-text [&_input]:size-4 [&_input]:accent-payo-green",
  monthLabel:
    "flex justify-between border-b border-payo-border-soft bg-[#fafbfa] px-[19px] py-2.5 text-[11px] font-extrabold tracking-[0.06em] text-payo-muted uppercase max-[760px]:px-[15px]",
  back: "mb-3.5 inline-flex items-center gap-[5px] text-xs font-bold text-payo-muted no-underline hover:text-payo-green-dark",
  hideSm: "max-[760px]:hidden",
  /** Group row in lists (dashboard, admin). */
  groupCard:
    "flex min-h-[67px] items-center gap-2.5 border-b border-payo-border-soft px-[17px] py-2.5 no-underline transition-[background] duration-[180ms] hover:bg-[#fafbfa]",
  groupCardAvatar:
    "flex size-[33px] flex-[0_0_33px] items-center justify-center rounded-lg bg-[#eef1ee] text-[12.5px] font-extrabold text-[#475467]",
  groupCardInfo:
    "flex min-w-0 flex-1 flex-col gap-1 [&>strong]:truncate [&>strong]:text-xs [&>strong]:font-bold [&>strong]:text-[#344054] [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:text-[11px] [&>span]:font-medium [&>span]:text-payo-light",
  groupBalance: "text-xs font-[750]",
  chevron: "text-[#c2c7c1]",
  newGroup:
    "mx-[17px] my-[13px] flex h-[39px] w-[calc(100%-34px)] items-center justify-center gap-[7px] rounded-[7px] border border-payo-border bg-[#f7f8f6] text-xs font-bold text-[#475467] transition-[background,color] duration-[180ms] hover:bg-[#eef9f3] hover:text-payo-green-dark",
  spacer: "w-[30px] flex-[0_0_30px]",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mx-auto mb-[34px] flex max-w-[1280px] items-end justify-between gap-[30px] max-[760px]:mb-[25px] max-[760px]:flex-wrap max-[760px]:items-start">
      <div>
        {back}
        {eyebrow && (
          <span className="mb-[9px] block text-[11.5px] font-extrabold tracking-[0.13em] text-payo-green">{eyebrow}</span>
        )}
        <h1 className="m-0 text-[clamp(27px,3vw,34px)] leading-[1.1] font-medium tracking-[-0.045em] text-payo-ink max-[760px]:text-[25px] max-[430px]:text-[23px] [&_strong]:font-bold">
          {title}
        </h1>
        {description && (
          <p className="mt-[9px] mb-0 text-[13px] font-medium text-payo-muted max-[760px]:max-w-[260px] max-[760px]:leading-normal">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {Icon && (
        <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-payo-green-soft text-payo-green-dark">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      )}
      <strong className="text-sm font-bold text-payo-ink">{title}</strong>
      {text && <p className="mt-0 mb-2 max-w-[340px] text-[13px] leading-normal text-payo-muted">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div
      className="mb-4 flex items-center gap-2.5 rounded-[10px] border border-[#f6d4d4] bg-payo-red-soft px-3.5 py-2.5 text-[13px] font-semibold text-[#a33a3a]"
      role="alert"
    >
      <AlertTriangle size={16} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" className={btnSm.ghost} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

const shimmer =
  "block animate-[payo-shimmer_1.2s_linear_infinite] rounded-md bg-[linear-gradient(90deg,#f0f1ef_0%,#f7f8f6_50%,#f0f1ef_100%)] bg-[length:200%_100%]";

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-[11px] border-b border-payo-border-soft px-[19px] py-3.5">
          <span className={cx(shimmer, "size-[33px] flex-[0_0_33px] !rounded-lg")} />
          <div className="flex flex-1 flex-col gap-1.5">
            <span className={cx(shimmer, "h-2.5 w-[46%]")} />
            <span className={cx(shimmer, "h-2 w-[28%]")} />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface MenuItem {
  label: string;
  onClick?: () => void;
  to?: string;
  danger?: boolean;
  icon?: LucideIcon;
}

const menuItemClass = (danger?: boolean) =>
  cx(
    "flex w-full items-center gap-2 rounded-[7px] px-2.5 py-[9px] text-left text-[13px] font-semibold no-underline",
    danger ? "text-[#b84343] hover:bg-payo-red-soft" : "text-payo-text hover:bg-[#f5f6f4]"
  );

// Small "..." menu.
export function RowMenu({ items, label = "More actions" }: { items: (MenuItem | false | null | undefined)[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.filter(Boolean) as MenuItem[];
  if (!visible.length) return <span className={page.spacer} />;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex h-[30px] w-[26px] items-center justify-center rounded-[7px] p-0 text-payo-light hover:bg-[#f5f6f4] hover:text-payo-ink"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={17} />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+4px)] right-0 z-50 min-w-40 rounded-[10px] border border-payo-border bg-white p-[5px] shadow-[0_12px_30px_rgba(17,24,39,0.12)]"
          role="menu"
        >
          {visible.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                {Icon && <Icon size={14} />}
                {item.label}
              </>
            );
            return item.to ? (
              <Link
                key={item.label}
                href={item.to}
                role="menuitem"
                className={menuItemClass()}
                onClick={() => setOpen(false)}
              >
                {content}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={menuItemClass(item.danger)}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// One expense line, showing how it affects the current user.
export function ExpenseRow({
  expense,
  userId,
  groupName,
  memberName,
  currency = "EUR",
  menuItems = [],
}: {
  expense: Expense;
  userId: string | undefined;
  groupName?: string;
  memberName: (id: string) => string;
  currency?: string;
  menuItems?: (MenuItem | false | null | undefined)[];
}) {
  const cat = categoryFor(expense.category);
  const Icon = cat.icon;
  const impact = expenseImpact(expense, userId);
  const payer = memberName(expense.paid_by);

  let impactLabel = "Not involved";
  let impactClass = "font-medium text-payo-light";
  if (impact > 0) {
    impactLabel = `you lent ${formatCents(impact, currency)}`;
    impactClass = "font-bold text-payo-green";
  } else if (impact < 0) {
    impactLabel = `you owe ${formatCents(-impact, currency)}`;
    impactClass = "font-bold text-payo-red";
  } else if (expense.paid_by === userId) {
    impactLabel = "your own expense";
  }

  return (
    <div className="flex min-h-[67px] items-center gap-[11px] border-b border-payo-border-soft px-[19px] py-2.5 last:border-b-0 max-[760px]:px-[15px]">
      <div className="flex size-[33px] flex-[0_0_33px] items-center justify-center rounded-lg bg-[#f5f6f4] text-payo-muted">
        <Icon size={17} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <strong className="truncate text-xs font-bold text-[#344054]">{expense.description}</strong>
        <span className="truncate text-[11px] font-medium text-payo-light">
          {[groupName, friendlyDate(expense.expense_date), cat.label].filter(Boolean).join(" · ")}
        </span>
      </div>

      <div className="flex flex-col items-end gap-1 whitespace-nowrap max-[560px]:max-w-[40%]">
        <strong className="text-xs font-[750] text-[#344054]">{formatMoney(expense.amount, currency)}</strong>
        <span className="text-[11px] font-medium text-payo-light max-[430px]:text-right max-[430px]:whitespace-normal">
          <span className="max-[560px]:hidden">{payer} paid · </span>
          <em className={cx("not-italic", impactClass)}>{impactLabel}</em>
        </span>
      </div>

      <RowMenu items={menuItems} />
    </div>
  );
}

/** Overlapping round avatars (group members). */
export function AvatarStack({
  names,
  small = false,
  max = 4,
}: {
  names: { key: string; label: string; title?: string }[];
  small?: boolean;
  max?: number;
}) {
  const item = cx(
    "-ml-1.5 flex items-center justify-center rounded-full border-2 border-white bg-[#eef1ee] font-extrabold text-[#475467] first:ml-0",
    small ? "size-6 text-[9px]" : "size-7 text-[10px]"
  );
  return (
    <div className={cx("flex", small ? "mt-2.5" : "mb-4")}>
      {names.slice(0, max).map((n) => (
        <span key={n.key} title={n.title} className={item}>
          {n.label}
        </span>
      ))}
      {names.length > max && <span className={item}>+{names.length - max}</span>}
    </div>
  );
}

/** Bar chart pieces shared by the admin overview and the monthly summary. */
export const chart = {
  /** 4 KPI tiles (2 per row below 1100px). */
  stats: "mb-6 grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[760px]:gap-2.5",
  statCard: "!min-h-[130px]",
  wrap: "flex h-[260px] items-stretch gap-3.5 px-[22px] pt-[22px] pb-[18px] max-[760px]:h-[220px] max-[760px]:gap-2 max-[760px]:px-[15px] max-[760px]:pt-[18px] max-[760px]:pb-3.5",
  col: "group/col flex min-w-0 flex-1 flex-col items-center gap-2",
  track: "relative flex w-full max-w-[52px] flex-1 items-end overflow-hidden rounded-lg bg-[#f5f6f4]",
  bar: "absolute inset-x-0 bottom-0 rounded-[8px_8px_0_0] bg-payo-green transition-[height] duration-[400ms] ease-in-out",
  value: "min-h-[15px] text-[11px] font-bold whitespace-nowrap text-payo-text max-[760px]:text-[10px]",
  label: "text-xs font-semibold text-payo-muted",
};
