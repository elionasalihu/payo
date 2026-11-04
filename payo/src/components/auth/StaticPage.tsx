import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PayoWordmark, auth } from "./authStyles";
import { cx } from "../ui/classes";

// Single-column page in the auth style (legal pages, 404, offline).
export default function StaticPage({
  eyebrow,
  title,
  subtitle,
  children,
  wide = false,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  wide?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={auth.pageSingle}>
      <div className={auth.formSide}>
        <div className={auth.top}>
          <PayoWordmark />
        </div>
        <div className={cx(auth.card, wide && "!max-w-[620px]")}>
          <span className={auth.eyebrow}>{eyebrow}</span>
          <h1 className={auth.h1}>{title}</h1>
          {subtitle && <p className={auth.subtitle}>{subtitle}</p>}
          {children}
          <div className={auth.form}>
            {action ?? (
              <Link href="/" className={auth.submit}>
                <ArrowLeft size={16} /> Back to home
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mt-7 mb-1.5 text-base font-bold tracking-[-0.02em]">{title}</h2>
      <p className="m-0 text-sm leading-[1.6] text-payo-muted">{children}</p>
    </section>
  );
}
