"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import Logo from "./Logo";
import { useAuth } from "../providers/AuthProvider";

const navLink = "text-[13px] font-semibold text-payo-muted no-underline transition-colors duration-[180ms] hover:text-payo-ink max-[900px]:text-xs";
const cta =
  "group inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-payo-green px-4 font-sans text-xs font-bold text-white no-underline transition-[background,transform] duration-[180ms] hover:-translate-y-px hover:bg-payo-green-dark max-[800px]:hidden [&>svg]:transition-transform [&>svg]:duration-[180ms] hover:[&>svg]:translate-x-0.5";
const mobileLink =
  "flex min-h-[52px] items-center border-b border-payo-border font-sans text-sm font-semibold text-payo-text no-underline transition-colors duration-[180ms] hover:text-payo-green";
const mobileCta =
  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-payo-green px-[17px] font-sans text-xs font-bold text-white no-underline";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-payo-border bg-[rgba(248,249,247,0.94)] backdrop-blur-[14px]">
      <div className="mx-auto grid h-[78px] w-[min(1180px,calc(100%-48px))] grid-cols-[1fr_auto_1fr] items-center max-[900px]:w-[min(100%-36px,1180px)] max-[800px]:h-[70px] max-[800px]:w-[calc(100%-36px)] max-[800px]:grid-cols-[1fr_auto] max-[480px]:h-[66px] max-[480px]:w-[calc(100%-28px)]">
        <Logo />

        <nav className="flex items-center gap-[34px] font-sans max-[900px]:gap-[22px] max-[800px]:hidden">
          <a href="#features" className={navLink}>
            Features
          </a>
          <a href="#how-it-works" className={navLink}>
            How it works
          </a>
          <a href="#about" className={navLink}>
            About
          </a>
        </nav>

        <div className="flex items-center justify-end gap-[22px] max-[800px]:gap-2.5">
          {user ? (
            <Link href="/client" className={cta}>
              Open dashboard
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-sans text-[13px] font-bold text-payo-text no-underline transition-colors duration-[180ms] hover:text-payo-green max-[800px]:hidden"
              >
                Log in
              </Link>

              <Link href="/register" className={cta}>
                Get started
                <ArrowRight size={15} />
              </Link>
            </>
          )}

          <button
            className="hidden size-10 items-center justify-center rounded-lg border border-[#e0e3df] bg-white p-0 text-payo-ink transition-[background,border-color] duration-[180ms] hover:border-[#d5d9d4] hover:bg-[#f3f5f2] max-[800px]:inline-flex max-[480px]:size-[38px]"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="hidden w-full overflow-hidden border-t border-payo-border bg-[rgba(248,249,247,0.98)] px-[18px] pb-[22px] max-[800px]:block max-[480px]:px-3.5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <nav className="flex flex-col">
              <a href="#features" onClick={closeMenu} className={mobileLink}>
                Features
              </a>
              <a href="#how-it-works" onClick={closeMenu} className={mobileLink}>
                How it works
              </a>
              <a href="#about" onClick={closeMenu} className={mobileLink}>
                About
              </a>
            </nav>

            <div className="flex items-center gap-3 pt-[18px]">
              {user ? (
                <Link href="/client" className={mobileCta} onClick={closeMenu}>
                  Open dashboard
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[42px] items-center justify-center px-[17px] font-sans text-xs font-bold text-payo-text no-underline"
                    onClick={closeMenu}
                  >
                    Log in
                  </Link>
                  <Link href="/register" className={mobileCta} onClick={closeMenu}>
                    Get started
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
