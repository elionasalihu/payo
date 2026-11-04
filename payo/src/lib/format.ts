import {
  BedDouble,
  Car,
  Coffee,
  House,
  Plane,
  ReceiptText,
  ShoppingCart,
  Ticket,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { value: "general", label: "General", icon: ReceiptText },
  { value: "food", label: "Food & drinks", icon: UtensilsCrossed },
  { value: "groceries", label: "Groceries", icon: ShoppingCart },
  { value: "coffee", label: "Coffee", icon: Coffee },
  { value: "transport", label: "Transport", icon: Car },
  { value: "travel", label: "Travel", icon: Plane },
  { value: "stay", label: "Accommodation", icon: BedDouble },
  { value: "rent", label: "Rent", icon: House },
  { value: "utilities", label: "Utilities", icon: Zap },
  { value: "entertainment", label: "Entertainment", icon: Ticket },
];

export const categoryFor = (value: string | null | undefined): Category =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];

export function initials(name: string | null | undefined = ""): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const firstName = (name: string | null | undefined = ""): string =>
  (name || "").trim().split(/\s+/)[0] || "there";

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "Today", "Yesterday", "Sep 28" or "Sep 28, 2025"
export function friendlyDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  // Treat plain dates (YYYY-MM-DD) as local dates, not UTC
  const d =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  const today = startOfDay(new Date());
  const diff = Math.round((today.getTime() - startOfDay(d).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Stable pastel tone for a group avatar based on its id
export const TONES = ["green", "blue", "orange", "violet", "rose", "teal"] as const;
export type Tone = (typeof TONES)[number];

export function toneFor(id = ""): Tone {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
