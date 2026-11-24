import { toCents } from "./money";
import type { Cents, Expense, Group, Settlement } from "./types";

type ExpenseRow = Pick<Expense, "group_id" | "amount" | "paid_by" | "expense_date"> &
  Partial<Pick<Expense, "id" | "category" | "description">> & {
    splits?: { user_id: string; amount: number }[];
  };
type SettlementRow = Pick<Settlement, "group_id" | "from_user" | "to_user" | "amount" | "created_at">;

// "2026-10" for a Date or ISO string
export function monthKeyOf(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Shift a "YYYY-MM" key by n months
export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKeyOf(d);
}

export function monthLabel(
  key: string,
  opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }
): string {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("en-US", opts);
}

// Settlements carry a timestamp; use the local date's month
const settlementMonth = (s: SettlementRow) => monthKeyOf(new Date(s.created_at));

const shareOf = (expense: ExpenseRow, userId: string | undefined): Cents => {
  const s = (expense.splits || []).find((x) => x.user_id === userId);
  return s ? toCents(s.amount) : 0;
};

export interface CategoryTotal {
  category: string;
  totalCents: Cents;
  shareCents: Cents;
  count: number;
}

export interface GroupTotal {
  groupId: string;
  name: string;
  totalCents: Cents;
  shareCents: Cents;
  count: number;
}

export interface MonthlySummary<E extends ExpenseRow = ExpenseRow> {
  monthKey: string;
  count: number;
  totalCents: Cents;
  myShareCents: Cents;
  paidCents: Cents;
  netCents: Cents;
  settledOutCents: Cents;
  settledInCents: Cents;
  paymentsCount: number;
  prevShareCents: Cents;
  changePct: number | null;
  biggest: E | null;
  categories: CategoryTotal[];
  groups: GroupTotal[];
  expenses: E[];
  trend: { key: string; shareCents: Cents; totalCents: Cents }[];
}

// Everything the monthly summary page needs for one month.
// All money values are integer cents.
// groupId: optional - restrict to one group ("all" or undefined = every group)
export function monthlySummary<E extends ExpenseRow>(
  {
    groups,
    expenses,
    settlements,
  }: { groups: Pick<Group, "id" | "name">[]; expenses: E[]; settlements: SettlementRow[] },
  userId: string | undefined,
  monthKey: string,
  groupId = "all"
): MonthlySummary<E> {
  const inScope = (gid: string) => groupId === "all" || gid === groupId;

  const monthExpenses = expenses.filter((e) => inScope(e.group_id) && monthKeyOf(e.expense_date) === monthKey);
  const monthSettlements = settlements.filter((s) => inScope(s.group_id) && settlementMonth(s) === monthKey);

  let totalCents = 0;
  let myShareCents = 0;
  let paidCents = 0;

  const categories: Record<string, CategoryTotal> = {};
  const byGroup: Record<string, Omit<GroupTotal, "name">> = {};

  monthExpenses.forEach((e) => {
    const amount = toCents(e.amount);
    const share = shareOf(e, userId);

    totalCents += amount;
    myShareCents += share;
    if (e.paid_by === userId) paidCents += amount;

    const cat = e.category || "general";
    const c = (categories[cat] ||= { category: cat, totalCents: 0, shareCents: 0, count: 0 });
    c.totalCents += amount;
    c.shareCents += share;
    c.count += 1;

    const g = (byGroup[e.group_id] ||= { groupId: e.group_id, totalCents: 0, shareCents: 0, count: 0 });
    g.totalCents += amount;
    g.shareCents += share;
    g.count += 1;
  });

  const settledOutCents = monthSettlements
    .filter((s) => s.from_user === userId)
    .reduce((t, s) => t + toCents(s.amount), 0);
  const settledInCents = monthSettlements
    .filter((s) => s.to_user === userId)
    .reduce((t, s) => t + toCents(s.amount), 0);

  const biggest = [...monthExpenses].sort((a, b) => toCents(b.amount) - toCents(a.amount))[0] || null;

  // Previous month, for comparison of "your spending"
  const prevKey = shiftMonth(monthKey, -1);
  const prevShareCents = expenses
    .filter((e) => inScope(e.group_id) && monthKeyOf(e.expense_date) === prevKey)
    .reduce((t, e) => t + shareOf(e, userId), 0);

  const changePct =
    prevShareCents > 0 ? Math.round(((myShareCents - prevShareCents) / prevShareCents) * 100) : null;

  // Last 6 months ending at monthKey
  const trend: MonthlySummary["trend"] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const k = shiftMonth(monthKey, -i);
    const list = expenses.filter((e) => inScope(e.group_id) && monthKeyOf(e.expense_date) === k);
    trend.push({
      key: k,
      shareCents: list.reduce((t, e) => t + shareOf(e, userId), 0),
      totalCents: list.reduce((t, e) => t + toCents(e.amount), 0),
    });
  }

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name || "Group";

  return {
    monthKey,
    count: monthExpenses.length,
    totalCents,
    myShareCents,
    paidCents,
    // What this month's expenses did to your balance (paid for others minus what others paid for you)
    netCents: paidCents - myShareCents,
    settledOutCents,
    settledInCents,
    paymentsCount: monthSettlements.length,
    prevShareCents,
    changePct,
    biggest,
    categories: Object.values(categories).sort(
      (a, b) => b.shareCents - a.shareCents || b.totalCents - a.totalCents
    ),
    groups: Object.values(byGroup)
      .map((g) => ({ ...g, name: groupName(g.groupId) }))
      .sort((a, b) => b.totalCents - a.totalCents),
    expenses: monthExpenses,
    trend,
  };
}
