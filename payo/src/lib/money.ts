import type { Cents } from "./types";

// All money math happens in integer cents to avoid floating-point drift.

export const toCents = (value: number | string | null | undefined): Cents =>
  Math.round(Number(value || 0) * 100);

export const fromCents = (cents: Cents): number => cents / 100;

const formatters: Record<string, Intl.NumberFormat> = {};

export function formatMoney(
  value: number | string | null | undefined,
  currency = "EUR",
  { sign = false }: { sign?: boolean } = {}
): string {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  const n = Number(value || 0);
  const text = formatters[currency].format(Math.abs(n));
  if (!sign) return n < 0 ? `-${text}` : text;
  if (Math.abs(n) < 0.005) return text;
  return `${n > 0 ? "+" : "-"}${text}`;
}

export const formatCents = (cents: Cents, currency?: string, opts?: { sign?: boolean }): string =>
  formatMoney(fromCents(cents), currency, opts);

/** Symbol shown in money inputs ("€" for EUR, otherwise the ISO code). */
export const currencySymbol = (currency?: string | null): string =>
  !currency || currency === "EUR" ? "€" : currency;

// Split an amount (in cents) equally between `ids`.
//
// Algorithm (largest-remainder with a fixed order):
//   base      = floor(total / n)          -> everyone gets at least this
//   remainder = total - base * n          -> 0 <= remainder < n leftover cents
//   the first `remainder` ids in the list get base + 1, the rest get base.
//
// Example: 10000 cents between 3 people -> base 3333, remainder 1
//          -> { A: 3334, B: 3333, C: 3333 } (sum 10000).
//
// The order of `ids` decides who receives the extra cents. AddExpenseModal
// passes group members in join order (group_members.joined_at ascending),
// so the result is deterministic for the same group and selection.
// Shares never differ by more than 1 cent and always sum exactly to the total.
export function splitEqually(totalCents: Cents, ids: string[]): Record<string, Cents> {
  if (!ids.length) return {};
  const base = Math.floor(totalCents / ids.length);
  let remainder = totalCents - base * ids.length;
  const result: Record<string, Cents> = {};
  ids.forEach((id) => {
    result[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  });
  return result;
}

// Parse a user-typed amount like "12,50" or "12.5". Returns NaN when invalid.
export function parseAmount(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  const cleaned = String(input || "").trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
