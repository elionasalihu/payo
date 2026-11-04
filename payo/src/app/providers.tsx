"use client";

import type { ReactNode } from "react";

import { PwaProvider } from "@/components/providers/PwaProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { PwaBanners } from "@/components/pwa/PwaUI";

// App-wide React Context providers (same order as the original App.js).
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PwaProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
      <PwaBanners />
    </PwaProvider>
  );
}
