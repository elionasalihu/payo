"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Next.js replacement for React Router's <NavLink>: knows whether it points to the current page.
export function useIsActive(href: string, end = false): boolean {
  const pathname = usePathname() || "/";
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinkProps {
  href: string;
  end?: boolean;
  className: string | ((isActive: boolean) => string);
  children: ReactNode | ((isActive: boolean) => ReactNode);
  "aria-label"?: string;
}

export default function NavLink({ href, end = false, className, children, ...rest }: NavLinkProps) {
  const isActive = useIsActive(href, end);
  return (
    <Link
      href={href}
      className={typeof className === "function" ? className(isActive) : className}
      aria-current={isActive ? "page" : undefined}
      {...rest}
    >
      {typeof children === "function" ? children(isActive) : children}
    </Link>
  );
}
