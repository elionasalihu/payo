import Link from "next/link";

import { cx } from "../ui/classes";

// "payo." wordmark used in the landing header and footer
export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Payo home"
      className={cx(
        "inline-flex w-fit items-baseline font-display text-[22px] leading-none font-semibold tracking-[-0.055em] text-payo-ink no-underline transition-opacity duration-[180ms] hover:opacity-[0.72] max-[480px]:text-[21px]",
        className
      )}
    >
      <span>pay</span>
      <span className="font-bold text-payo-green">o</span>
      <span>.</span>
    </Link>
  );
}
