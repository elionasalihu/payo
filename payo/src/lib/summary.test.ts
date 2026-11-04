import { expect, test } from "vitest";
import { monthlySummary, shiftMonth, monthKeyOf } from "./summary";

const A = "a";
const B = "b";

const data = {
  groups: [{ id: "g1", name: "Flat" }, { id: "g2", name: "Trip" }],
  expenses: [
    // October
    { id: "1", group_id: "g1", category: "groceries", amount: 60, paid_by: A, expense_date: "2026-10-03", splits: [{ user_id: A, amount: 30 }, { user_id: B, amount: 30 }] },
    { id: "2", group_id: "g2", category: "stay", amount: 200, paid_by: B, expense_date: "2026-10-10", splits: [{ user_id: A, amount: 100 }, { user_id: B, amount: 100 }] },
    { id: "3", group_id: "g1", category: "groceries", amount: 20, paid_by: B, expense_date: "2026-10-31", splits: [{ user_id: B, amount: 20 }] },
    // September
    { id: "4", group_id: "g1", category: "utilities", amount: 100, paid_by: A, expense_date: "2026-09-15", splits: [{ user_id: A, amount: 50 }, { user_id: B, amount: 50 }] },
  ],
  settlements: [
    { group_id: "g2", from_user: A, to_user: B, amount: 70, created_at: "2026-10-12T10:00:00" },
    { group_id: "g1", from_user: B, to_user: A, amount: 50, created_at: "2026-09-20T10:00:00" },
  ],
};

test("month helpers", () => {
  expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  expect(monthKeyOf("2026-10-31")).toBe("2026-10");
});

test("monthly totals for one user", () => {
  const s = monthlySummary(data, A, "2026-10");
  expect(s.count).toBe(3);
  expect(s.totalCents).toBe(28000);
  expect(s.myShareCents).toBe(13000);
  expect(s.paidCents).toBe(6000);
  expect(s.netCents).toBe(-7000);
  expect(s.settledOutCents).toBe(7000);
  expect(s.settledInCents).toBe(0);
  expect(s.biggest?.id).toBe("2");
});

test("category and group breakdown", () => {
  const s = monthlySummary(data, A, "2026-10");
  expect(s.categories[0]).toMatchObject({ category: "stay", shareCents: 10000 });
  expect(s.categories[1]).toMatchObject({ category: "groceries", shareCents: 3000, totalCents: 8000, count: 2 });
  expect(s.groups.map((g) => g.name)).toEqual(["Trip", "Flat"]);
});

test("comparison with previous month and 6-month trend", () => {
  const s = monthlySummary(data, A, "2026-10");
  expect(s.prevShareCents).toBe(5000);
  expect(s.changePct).toBe(160);
  expect(s.trend).toHaveLength(6);
  expect(s.trend[5]).toMatchObject({ key: "2026-10", shareCents: 13000 });
  expect(s.trend[4]).toMatchObject({ key: "2026-09", shareCents: 5000 });
});

test("group filter", () => {
  const s = monthlySummary(data, A, "2026-10", "g1");
  expect(s.count).toBe(2);
  expect(s.myShareCents).toBe(3000);
  expect(s.settledOutCents).toBe(0);
});

test("empty month", () => {
  const s = monthlySummary(data, A, "2026-05");
  expect(s.count).toBe(0);
  expect(s.changePct).toBe(null);
  expect(s.biggest).toBe(null);
});
