import { toCents } from "./money";
import type { Cents, Expense, Group, GroupMember, Settlement, WorkspaceData } from "./types";

// Minimal shapes the calculations need (so tests can pass small objects).
export type ExpenseLike = Pick<Expense, "paid_by" | "amount"> & { splits?: { user_id: string; amount: number }[] };
export type SettlementLike = Pick<Settlement, "from_user" | "to_user" | "amount">;

export type NetBalances = Record<string, Cents>;

export interface Payment {
  from: string;
  to: string;
  cents: Cents;
}

// Net balance per user in a group, in cents.
// positive = the group owes them, negative = they owe the group
export function computeNetBalances(
  memberIds: string[],
  expenses: ExpenseLike[],
  settlements: SettlementLike[]
): NetBalances {
  const net: NetBalances = {};
  memberIds.forEach((id) => {
    net[id] = 0;
  });

  const add = (id: string, cents: Cents) => {
    net[id] = (net[id] || 0) + cents;
  };

  expenses.forEach((expense) => {
    add(expense.paid_by, toCents(expense.amount));
    (expense.splits || []).forEach((split) => add(split.user_id, -toCents(split.amount)));
  });

  settlements.forEach((s) => {
    // The payer has reduced their debt; the receiver has been paid back.
    add(s.from_user, toCents(s.amount));
    add(s.to_user, -toCents(s.amount));
  });

  return net;
}

// Settle up suggestions: biggest debtor pays biggest creditor until everyone is at 0.
export function simplifyDebts(net: NetBalances): Payment[] {
  const debtors: { id: string; cents: Cents }[] = [];
  const creditors: { id: string; cents: Cents }[] = [];

  Object.entries(net).forEach(([id, cents]) => {
    if (cents < 0) debtors.push({ id, cents: -cents });
    else if (cents > 0) creditors.push({ id, cents });
  });

  debtors.sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
  creditors.sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));

  const payments: Payment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].cents, creditors[j].cents);
    if (pay > 0) payments.push({ from: debtors[i].id, to: creditors[j].id, cents: pay });
    debtors[i].cents -= pay;
    creditors[j].cents -= pay;
    if (debtors[i].cents === 0) i += 1;
    if (creditors[j].cents === 0) j += 1;
  }

  return payments;
}

// How a single expense affects `userId`, in cents (positive = lent, negative = borrowed).
export function expenseImpact(expense: ExpenseLike, userId: string | undefined): Cents {
  const share = (expense.splits || []).find((s) => s.user_id === userId);
  const shareCents = share ? toCents(share.amount) : 0;
  if (expense.paid_by === userId) return toCents(expense.amount) - shareCents;
  return 0 - shareCents;
}

export interface GroupSummary {
  group: Group;
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
  net: NetBalances;
  myNet: Cents;
  totalCents: Cents;
  payments: Payment[];
}

export interface WorkspaceSummary {
  byGroup: Record<string, GroupSummary>;
  oweCents: Cents;
  owedCents: Cents;
  totalCents: Cents;
  oweGroups: number;
  owedGroups: number;
}

// Build everything the UI needs from the raw workspace data.
export function buildSummary(
  { groups, members, expenses, settlements }: WorkspaceData,
  userId: string | undefined
): WorkspaceSummary {
  const byGroup: Record<string, GroupSummary> = {};

  groups.forEach((group) => {
    const groupMembers = members.filter((m) => m.group_id === group.id);
    const groupExpenses = expenses.filter((e) => e.group_id === group.id);
    const groupSettlements = settlements.filter((s) => s.group_id === group.id);
    const memberIds = groupMembers.map((m) => m.user_id);

    const net = computeNetBalances(memberIds, groupExpenses, groupSettlements);
    const totalCents = groupExpenses.reduce((sum, e) => sum + toCents(e.amount), 0);

    byGroup[group.id] = {
      group,
      members: groupMembers,
      expenses: groupExpenses,
      settlements: groupSettlements,
      net,
      myNet: (userId && net[userId]) || 0,
      totalCents,
      payments: simplifyDebts(net),
    };
  });

  const nets = Object.values(byGroup).map((g) => g.myNet);
  const oweCents = nets.filter((n) => n < 0).reduce((s, n) => s - n, 0);
  const owedCents = nets.filter((n) => n > 0).reduce((s, n) => s + n, 0);

  return {
    byGroup,
    oweCents,
    owedCents,
    totalCents: owedCents - oweCents,
    oweGroups: nets.filter((n) => n < 0).length,
    owedGroups: nets.filter((n) => n > 0).length,
  };
}
