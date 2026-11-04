"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { cx } from "../ui/classes";

type ToastType = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastApi {
  (message: string): void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const noop = Object.assign(() => {}, { success: () => {}, error: () => {} }) as ToastApi;
const ToastContext = createContext<ToastApi>(noop);

// Unique id per toast (only used as a React key)
let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, type: ToastType = "success") => {
    nextToastId += 1;
    const id = nextToastId;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600);
  }, []);

  const api = useMemo<ToastApi>(
    () =>
      Object.assign((msg: string) => toast(msg, "success"), {
        success: (msg: string) => toast(msg, "success"),
        error: (msg: string) => toast(msg, "error"),
      }),
    [toast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-5 bottom-5 z-[3000] flex flex-col gap-2 max-[760px]:right-4 max-[760px]:bottom-[84px] max-[760px]:left-4"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={cx(
                "pointer-events-auto max-w-[360px] min-w-[220px] rounded-[10px] px-3.5 py-3 text-[13px] leading-[1.4] font-semibold text-white shadow-[0_10px_30px_rgba(17,24,39,0.18)] max-[760px]:max-w-none",
                t.type === "error" ? "bg-[#7a2424]" : "bg-payo-ink"
              )}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role={t.type === "error" ? "alert" : "status"}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
