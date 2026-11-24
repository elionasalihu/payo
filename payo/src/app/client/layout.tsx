"use client";

import { Suspense, type ReactNode } from "react";

import { FullPageLoader, RequireAuth } from "@/components/auth/RouteGuards";
import ClientShell from "@/components/dashboard/ClientShell";

// Every page under /client requires a signed-in user and shares the workspace data.
export default function ClientLayout({ children }: { children: ReactNode }) {
  // Suspense: the guards read the current URL, which is only known in the browser.
  return (
    <Suspense fallback={<FullPageLoader />}>
      <RequireAuth>
        <ClientShell>{children}</ClientShell>
      </RequireAuth>
    </Suspense>
  );
}
