import { describe, expect, test } from "vitest";
import { formatCents, fromCents, parseAmount, splitEqually, toCents } from "./money";

const sum = (obj: Record<string, number>) => Object.values(obj).reduce((s, n) => s + n, 0);

describe("splitEqually", () => {
  test("€100.00 between 3 people -> 33.34 / 33.33 / 33.33", () => {
    const parts = splitEqually(10000, ["a", "b", "c"]);
    expect(parts).toEqual({ a: 3334, b: 3333, c: 3333 });
    expect(sum(parts)).toBe(10000);
  });

  test("the extra cents go to the first people in the given order", () => {
    expect(splitEqually(1001, ["x", "y", "z"])).toEqual({ x: 334, y: 334, z: 333 });
    expect(splitEqually(1001, ["z", "y", "x"])).toEqual({ z: 334, y: 334, x: 333 });
  });

  test("is deterministic for the same input", () => {
    const ids = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
    expect(splitEqually(12345, ids)).toEqual(splitEqually(12345, ids));
  });

  test("even split has no remainder", () => {
    expect(splitEqually(9000, ["a", "b", "c"])).toEqual({ a: 3000, b: 3000, c: 3000 });
  });

  test("single participant gets the whole amount", () => {
    expect(splitEqually(4999, ["solo"])).toEqual({ solo: 4999 });
  });

  test("more people than cents: some shares are zero, total still exact", () => {
    const parts = splitEqually(2, ["a", "b", "c"]);
    expect(parts).toEqual({ a: 1, b: 1, c: 0 });
    expect(sum(parts)).toBe(2);
  });

  test("empty participant list returns an empty object", () => {
    expect(splitEqually(1000, [])).toEqual({});
  });

  test("no cents are lost or created, shares differ by at most 1 cent (exhaustive small range)", () => {
    for (let total = 1; total <= 2000; total += 1) {
      for (let n = 1; n <= 12; n += 1) {
        const ids = Array.from({ length: n }, (_, i) => `u${i}`);
        const values = Object.values(splitEqually(total, ids));
        expect(values.reduce((s, v) => s + v, 0)).toBe(total);
        expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("toCents / fromCents", () => {
  test("converts 2-decimal amounts without floating-point drift", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(1.15)).toBe(115);
    expect(toCents("33.33")).toBe(3333);
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(null)).toBe(0);
  });

  test("round-trips every cent value from 0.00 to 1000.00", () => {
    for (let c = 0; c <= 100000; c += 1) {
      expect(toCents(fromCents(c))).toBe(c);
    }
  });
});

describe("parseAmount", () => {
  test("accepts dot or comma decimals, up to 2 places", () => {
    expect(parseAmount("12.50")).toBe(12.5);
    expect(parseAmount("12,5")).toBe(12.5);
    expect(parseAmount(" 7 ")).toBe(7);
  });

  test("rejects invalid input", () => {
    expect(parseAmount("12.345")).toBeNaN();
    expect(parseAmount("-5")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("")).toBeNaN();
  });
});

describe("formatCents", () => {
  test("formats euros with two decimals", () => {
    expect(formatCents(3334, "EUR")).toBe("€33.34");
    expect(formatCents(-500, "EUR", { sign: true })).toBe("-€5.00");
    expect(formatCents(500, "EUR", { sign: true })).toBe("+€5.00");
  });
});
