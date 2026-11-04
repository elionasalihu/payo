"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";

import { cx } from "../ui/classes";
import { PayoWordmark, auth } from "./authStyles";

export { PayoWordmark, auth };
import { isSupabaseConfigured } from "@/lib/supabase/client";

const alert = "flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-[13px] leading-[1.45] font-semibold [&>svg]:mt-px [&>svg]:flex-none [&_code]:text-[11px]";

const points = [
  "Groups for trips, rent, dinners and more",
  "Automatic, cent-accurate splits",
  "One tap to see who owes whom",
];

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={auth.page}>
      <div className={auth.formSide}>
        <div className={auth.top}>
          <PayoWordmark />
        </div>

        <motion.div
          className={auth.card}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {!isSupabaseConfigured && (
            <div className={cx(alert, "mb-[22px] border border-[#f5e2b4] bg-[#fff8e8] text-[#8a5a00]")}>
              <AlertTriangle size={16} />
              <span>
                Supabase isn’t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart.
              </span>
            </div>
          )}

          {eyebrow && <span className={auth.eyebrow}>{eyebrow}</span>}
          <h1 className={auth.h1}>{title}</h1>
          {subtitle && <p className={auth.subtitle}>{subtitle}</p>}

          {children}
        </motion.div>

        {footer && (
          <div className="text-center text-[13px] font-medium text-payo-muted [&_a]:font-bold [&_a]:text-payo-ink [&_a]:no-underline [&_a:hover]:text-payo-green-dark">
            {footer}
          </div>
        )}
      </div>

      <aside
        className="relative m-3.5 flex items-center justify-center overflow-hidden rounded-[20px] bg-payo-ink text-white before:absolute before:top-[-160px] before:right-[-180px] before:size-[520px] before:rounded-full before:bg-[radial-gradient(circle,rgba(32,184,107,0.32),rgba(32,184,107,0)_70%)] before:content-[''] max-[900px]:hidden"
        aria-hidden="true"
      >
        <div className="relative w-[min(100%,440px)] p-10">
          <span className="text-[11px] font-extrabold tracking-[0.13em] text-payo-green">PAY TOGETHER. STAY ORGANIZED.</span>
          <h2 className="mt-3.5 mb-7 text-[clamp(30px,3vw,40px)] leading-[1.08] font-medium tracking-[-0.05em] [&_em]:font-display [&_em]:font-semibold [&_em]:text-payo-green [&_em]:not-italic">
            Shared money,
            <br />
            <em>without the awkward math.</em>
          </h2>

          <ul className="mt-0 mb-[34px] flex list-none flex-col gap-3 p-0">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-[#cfd5de]">
                <span className="flex size-[22px] items-center justify-center rounded-md bg-[rgba(32,184,107,0.16)] text-payo-green">
                  <Check size={13} strokeWidth={2.4} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="rounded-[14px] border border-white/10 bg-white/6 p-[18px]">
            <div className="flex justify-between text-sm font-semibold">
              <span>Weekend in Prizren</span>
              <strong>€642.80</strong>
            </div>
            <div className="my-3.5 h-1.5 overflow-hidden rounded-md bg-white/8">
              <span className="block h-full rounded-md bg-payo-green" style={{ width: "62%" }} />
            </div>
            <div className="flex justify-between text-xs font-semibold text-[#aab3c0]">
              <span>Arta pays Dren</span>
              <strong className="text-payo-green">€48.20</strong>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className={cx(alert, "border border-[#f6d4d4] bg-payo-red-soft text-[#a33a3a]")} role="alert">
      <AlertTriangle size={16} />
      <span>{message}</span>
    </div>
  );
}

export function friendlyAuthError(error: unknown): string {
  const raw = (error as { message?: string } | null)?.message || "";
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login credentials")) return "That email and password don’t match. Try again.";
  if (msg.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (msg.includes("user already registered")) return "An account with this email already exists. Try logging in.";
  if (msg.includes("password should be at least")) return "Password must be at least 8 characters.";
  if (msg.includes("rate limit")) return "Too many attempts. Please wait a minute and try again.";
  if (msg.includes("failed to fetch")) return "Can’t reach the server. Check your connection.";
  return raw || "Something went wrong. Please try again.";
}
