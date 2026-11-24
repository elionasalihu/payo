"use client";

import { Suspense, type ReactNode } from "react";

import { FullPageLoader, RequireAdmin } from "@/components/auth/RouteGuards";
import AdminShell from "@/components/dashboard/AdminShell";

// Every page under /admin requires profiles.role = 'admin'.
// (The database enforces the same rule with RLS, independently of this check.)
export default function AdminLayout({ children }: { children: ReactNode }) {
  // Suspense: the guards read the current URL, which is only known in the browser.
  return (
    <Suspense fallback={<FullPageLoader />}>
      <RequireAdmin>
        <AdminShell>{children}</AdminShell>
      </RequireAdmin>
    </Suspense>
  );
}
