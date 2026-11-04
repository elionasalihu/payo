"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "../providers/AuthProvider";

// Route protection in the browser. This only decides what is rendered:
// the real security boundary is Row Level Security in the database.

export function FullPageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center gap-2.5 text-[13px] font-semibold text-payo-muted"
      role="status"
      aria-live="polite"
    >
      <span className="size-2.5 animate-payo-pulse rounded-full bg-payo-green" />
      <span>Loading Payo…</span>
    </div>
  );
}

/** Where to go after logging in: the ?from= parameter if it is an in-app path, otherwise /client. */
export function redirectTarget(): string {
  const from = new URLSearchParams(window.location.search).get("from");
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/client";
}

// Only signed-in users. Sends everyone else to /login and back afterwards.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?from=${encodeURIComponent(pathname || "/client")}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <FullPageLoader />;
  return children;
}

// Only admins. Signed-in non-admins go back to their dashboard.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const waiting = loading || (user && !profile);

  useEffect(() => {
    if (waiting) return;
    if (!user) router.replace(`/login?from=${encodeURIComponent(pathname || "/admin")}`);
    else if (!isAdmin) router.replace("/client");
  }, [waiting, user, isAdmin, router, pathname]);

  if (waiting || !user || !isAdmin) return <FullPageLoader />;
  return children;
}

// Login/register pages. Don't wait for the session check here,
// otherwise a slow token refresh keeps the page on the loader.
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(redirectTarget());
  }, [user, router]);

  if (user) return <FullPageLoader />;
  return children;
}
