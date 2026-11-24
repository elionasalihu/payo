"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Install prompt, online/offline status, service worker registration and updates

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Captured by the inline script in app/layout.tsx before React loads. */
    __payoInstallPrompt?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export interface PwaContextValue {
  canInstall: boolean;
  showIOSHint: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  online: boolean;
  updateReady: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  applyUpdate: () => void;
}

const PwaContext = createContext<PwaContextValue | null>(null);

const standalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Browser-only values are read after mount (the server render has no window).
  useEffect(() => {
    setDeferredPrompt(window.__payoInstallPrompt || null);
    setIsInstalled(standalone());
    setOnline(navigator.onLine !== false);
    setIsIOS(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  useEffect(() => {
    const onInstallable = () => setDeferredPrompt(window.__payoInstallPrompt || null);
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__payoInstallPrompt = null;
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("payo:installable", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onMode = () => setIsInstalled(standalone());
    mq?.addEventListener?.("change", onMode);

    return () => {
      window.removeEventListener("payo:installable", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      mq?.removeEventListener?.("change", onMode);
    };
  }, []);

  // Register public/sw.js in production builds only (in `next dev` you always get fresh code).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return;
        // An update was already downloaded earlier and is waiting
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // New version installed while an old one still controls the page
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(registration.waiting || installing);
            }
          });
        });
      })
      .catch((error) => console.error("Service worker registration failed:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    window.__payoInstallPrompt = null;
    return outcome;
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    navigator.serviceWorker?.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt) && !isInstalled,
      showIOSHint: isIOS && !isInstalled,
      isInstalled,
      isIOS,
      online,
      updateReady: Boolean(waitingWorker),
      promptInstall,
      applyUpdate,
    }),
    [deferredPrompt, isInstalled, isIOS, online, waitingWorker, promptInstall, applyUpdate]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa(): PwaContextValue {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa must be used inside <PwaProvider>");
  return ctx;
}
