"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import Modal from "../ui/Modal";
import { btn, form } from "../ui/classes";

export interface ConfirmOptions {
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

// usage: if (await confirm({ title, message, danger: true })) { ... }
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState(options);
      }),
    []
  );

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(state)}
        onClose={() => close(false)}
        title={state?.title || "Are you sure?"}
        width={420}
        footer={
          <>
            <button type="button" className={btn.ghost} onClick={() => close(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={state?.danger ? btn.dangerSolid : btn.primary}
              onClick={() => close(true)}
              autoFocus
            >
              {state?.confirmLabel || "Confirm"}
            </button>
          </>
        }
      >
        <p className={form.confirmText}>{state?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
