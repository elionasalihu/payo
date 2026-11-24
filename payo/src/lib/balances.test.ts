import { expect, test } from "vitest";
import type { WorkspaceData } from "./types";
import { computeNetBalances, simplifyDebts, expenseImpact, buildSummary } from "./balances";
import { splitEqually, parseAmount, formatMoney } from "./money";

const A = "a";
const B = "b";
const C = "c";

const sum = (obj: Record<string, number>) => Object.values(obj).reduce((s, n) => s + n, 0);

test("equal split always adds up to the total", () => {
  const parts = splitEqually(10000, [A, B, C]);
  expect(parts).toEqual({ a: 3334, b: 3333, c: 3333 });
  expect(sum(parts)).toBe(10000);
  expect(sum(splitEqually(1, [A, B, C]))).toBe(1);
});

test("net balances: payer is owed, participants owe", () => {
  const expenses = [
    { paid_by: A, amount: 90, splits: [{ user_id: A, amount: 30 }, { user_id: B, amount: 30 }, { user_id: C, amount: 30 }] },
  ];
  const net = computeNetBalances([A, B, C], expenses, []);
  expect(net).toEqual({ a: 6000, b: -3000, c: -3000 });
  expect(sum(net)).toBe(0);
});

test("settlements reduce debt", () => {
  const expenses = [{ paid_by: A, amount: 60, splits: [{ user_id: A, amount: 30 }, { user_id: B, amount: 30 }] }];
  const net = computeNetBalances([A, B], expenses, [{ from_user: B, to_user: A, amount: 30 }]);
  expect(net).toEqual({ a: 0, b: 0 });
});

test("simplifyDebts produces minimal greedy payments that clear everything", () => {
  const net = { a: 5000, b: -2000, c: -3000 };
  const payments = simplifyDebts(net);
  expect(payments).toEqual([
    { from: "c", to: "a", cents: 3000 },
    { from: "b", to: "a", cents: 2000 },
  ]);

  const after: Record<string, number> = { ...net };
  payments.forEach((p) => {
    after[p.from] += p.cents;
    after[p.to] -= p.cents;
  });
  expect(Object.values(after).every((v) => v === 0)).toBe(true);
});

test("expenseImpact: lent vs borrowed", () => {
  const e = { paid_by: A, amount: 90, splits: [{ user_id: A, amount: 30 }, { user_id: B, amount: 60 }] };
  expect(expenseImpact(e, A)).toBe(6000);
  expect(expenseImpact(e, B)).toBe(-6000);
  expect(expenseImpact(e, C)).toBe(0);
});

test("buildSummary totals across groups", () => {
  const data = {
    groups: [{ id: "g1" }, { id: "g2" }],
    members: [
      { group_id: "g1", user_id: A },
      { group_id: "g1", user_id: B },
      { group_id: "g2", user_id: A },
      { group_id: "g2", user_id: B },
    ],
    expenses: [
      { group_id: "g1", paid_by: A, amount: 20, splits: [{ user_id: A, amount: 10 }, { user_id: B, amount: 10 }] },
      { group_id: "g2", paid_by: B, amount: 50, splits: [{ user_id: A, amount: 25 }, { user_id: B, amount: 25 }] },
    ],
    settlements: [],
  };
  const s = buildSummary(data as unknown as WorkspaceData, A);
  expect(s.owedCents).toBe(1000);
  expect(s.oweCents).toBe(2500);
  expect(s.totalCents).toBe(-1500);
  expect(s.byGroup.g1.totalCents).toBe(2000);
});

test("parseAmount accepts comma decimals and rejects junk", () => {
  expect(parseAmount("12,50")).toBe(12.5);
  expect(parseAmount("7")).toBe(7);
  expect(Number.isNaN(parseAmount("1.234"))).toBe(true);
  expect(Number.isNaN(parseAmount("abc"))).toBe(true);
});

test("formatMoney with sign", () => {
  expect(formatMoney(24.5, "EUR", { sign: true })).toBe("+€24.50");
  expect(formatMoney(-18.2, "EUR", { sign: true })).toBe("-€18.20");
  expect(formatMoney(0, "EUR", { sign: true })).toBe("€0.00");
});

// Added in the audit: end-to-end and property checks for balances/settlements

test("uneven equal split (€100 / 3) gives balances that sum to zero", () => {
  const parts = splitEqually(10000, [A, B, C]);
  const expense = {
    paid_by: A,
    amount: 100,
    splits: Object.entries(parts).map(([user_id, cents]) => ({ user_id, amount: cents / 100 })),
  };
  const net = computeNetBalances([A, B, C], [expense], []);
  expect(net).toEqual({ a: 6666, b: -3333, c: -3333 });
  expect(sum(net)).toBe(0);
});

test("a removed member keeps their balance in the group (shown as 'Former member')", () => {
  const expenses = [{ paid_by: A, amount: 40, splits: [{ user_id: A, amount: 20 }, { user_id: "gone", amount: 20 }] }];
  const net = computeNetBalances([A], expenses, []);
  expect(net).toEqual({ a: 2000, gone: -2000 });
});

test("random groups: net sums to 0 and settle-up suggestions clear every balance", () => {
  // Small deterministic pseudo-random generator so the test is reproducible.
  let seed = 42;
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };

  for (let round = 0; round < 300; round += 1) {
    const size = 2 + rand(6);
    const ids = Array.from({ length: size }, (_, i) => `u${i}`);
    const expenses = Array.from({ length: 1 + rand(8) }, () => {
      const totalCents = 1 + rand(50000);
      const participants = ids.filter(() => rand(2) === 1);
      const chosen = participants.length ? participants : [ids[0]];
      const parts = splitEqually(totalCents, chosen);
      return {
        paid_by: ids[rand(size)],
        amount: totalCents / 100,
        splits: Object.entries(parts).map(([user_id, cents]) => ({ user_id, amount: cents / 100 })),
      };
    });

    const net = computeNetBalances(ids, expenses, []);
    expect(sum(net)).toBe(0);

    const payments = simplifyDebts(net);
    // Greedy matching needs at most (non-zero members - 1) payments
    const nonZero = Object.values(net).filter((v) => v !== 0).length;
    expect(payments.length).toBeLessThanOrEqual(Math.max(0, nonZero - 1));

    // Recording every suggested payment as a settlement brings everyone to 0
    const settlements = payments.map((p) => ({ from_user: p.from, to_user: p.to, amount: p.cents / 100 }));
    const after = computeNetBalances(ids, expenses, settlements);
    expect(Object.values(after).every((v) => v === 0)).toBe(true);
  }
});
