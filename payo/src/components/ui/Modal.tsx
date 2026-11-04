"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, subtitle, children, footer, width = 520 }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-[rgba(17,24,39,0.42)] p-5 font-sans backdrop-blur-[3px] max-[560px]:items-end max-[560px]:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            className="flex max-h-[calc(100vh-40px)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(17,24,39,0.22)] max-[560px]:max-h-[92vh] max-[560px]:rounded-[18px_18px_0_0]"
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-payo-border-soft px-[22px] pt-5 pb-4">
              <div>
                <h2 className="m-0 text-lg font-bold tracking-[-0.03em]">{title}</h2>
                {subtitle && <p className="mt-[5px] mb-0 text-[13px] font-medium text-payo-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                className="flex size-[34px] flex-[0_0_34px] items-center justify-center rounded-[9px] bg-[#f5f6f4] text-payo-muted hover:text-payo-ink"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-[22px] py-5">{children}</div>

            {footer && (
              <div className="flex justify-end gap-2.5 border-t border-payo-border-soft bg-[#fafbfa] px-[22px] py-3.5 max-[560px]:[&>*]:flex-1">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
