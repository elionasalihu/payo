"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, RefreshCw, Share, SquarePlus, WifiOff } from "lucide-react";

import Modal from "../ui/Modal";
import { badge, cx, panel, btnSm } from "../ui/classes";
import { usePwa } from "../providers/PwaProvider";

const bannerBase =
  "pointer-events-auto flex items-center gap-[9px] rounded-[10px] px-3.5 py-2.5 font-sans text-[13px] leading-[1.4] font-semibold shadow-[0_10px_28px_rgba(17,24,39,0.16)] [&>svg]:flex-none";

// Banners shown app-wide: offline notice + "new version available".
export function PwaBanners() {
  const { online, updateReady, applyUpdate } = usePwa();

  return (
    <div
      className="pointer-events-none fixed top-3 left-1/2 z-[2500] flex w-[min(560px,calc(100%-32px))] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      <AnimatePresence>
        {!online && (
          <motion.div
            key="offline"
            data-testid="offline-banner"
            className={cx(bannerBase, "border border-[#f5e2b4] bg-[#fff8e8] text-[#8a5a00]")}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <WifiOff size={15} />
            You’re offline. Showing the app; new changes will need a connection.
          </motion.div>
        )}
        {updateReady && (
          <motion.div
            key="update"
            className={cx(bannerBase, "bg-payo-ink text-white")}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RefreshCw size={15} />
            A new version of Payo is ready.
            <button
              type="button"
              onClick={applyUpdate}
              className="ml-auto h-[30px] rounded-[7px] bg-payo-green px-3 text-xs font-bold text-white"
            >
              Reload
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const stepIcon =
  "flex size-[34px] flex-[0_0_34px] items-center justify-center rounded-[9px] bg-payo-green-soft font-display font-bold text-payo-green-dark";

// Install button. On iPhone/iPad there is no install prompt, so we show instructions instead
export function InstallAppButton({
  className = "",
  label = "Install app",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  const { canInstall, showIOSHint, promptInstall } = usePwa();
  const [iosOpen, setIosOpen] = useState(false);

  if (!canInstall && !showIOSHint) return null;

  const onClick = () => (canInstall ? promptInstall() : setIosOpen(true));

  return (
    <>
      <button type="button" className={className} onClick={onClick} aria-label={label} title={label}>
        <Download size={compact ? 18 : 17} strokeWidth={1.8} />
        {!compact && <span>{label}</span>}
      </button>

      <Modal open={iosOpen} onClose={() => setIosOpen(false)} title="Install Payo on your iPhone" width={420}>
        <ol className="m-0 flex list-none flex-col gap-3.5 p-0 [&>li]:flex [&>li]:items-center [&>li]:gap-3 [&>li]:text-sm [&>li]:leading-[1.45] [&>li]:text-payo-text">
          <li>
            <span className={stepIcon}>
              <Share size={16} />
            </span>
            <span>
              Tap the <b>Share</b> button in Safari’s toolbar.
            </span>
          </li>
          <li>
            <span className={stepIcon}>
              <SquarePlus size={16} />
            </span>
            <span>
              Choose <b>Add to Home Screen</b>.
            </span>
          </li>
          <li>
            <span className={stepIcon}>p.</span>
            <span>
              Tap <b>Add</b>. Payo opens full-screen like a normal app.
            </span>
          </li>
        </ol>
      </Modal>
    </>
  );
}

// Card for the Settings page that explains install status.
export function InstallAppCard() {
  const { canInstall, showIOSHint, isInstalled } = usePwa();

  return (
    <section className={panel.panel}>
      <div className={panel.header}>
        <div>
          <h2 className={panel.title}>
            <Download size={14} /> Install the app
          </h2>
          <p className={panel.subtitle}>
            {isInstalled
              ? "Payo is installed on this device."
              : canInstall || showIOSHint
                ? "Add Payo to your home screen for one-tap access and full-screen use. The app interface also opens offline."
                : "Open Payo in Chrome, Edge or Safari on your phone to install it."}
          </p>
        </div>
        {isInstalled ? (
          <span className={badge.green}>Installed</span>
        ) : (
          <InstallAppButton className={btnSm.primary} label="Install" />
        )}
      </div>
    </section>
  );
}
