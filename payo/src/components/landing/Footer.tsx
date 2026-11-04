import Link from "next/link";

import Logo from "./Logo";

const column = "flex flex-col gap-3";
const columnTitle = "mb-1 font-mono text-[8px] tracking-[0.7px] text-payo-ink uppercase";
const link = "text-[10px] text-payo-muted no-underline transition-colors duration-200 hover:text-payo-green-dark";

export default function Footer() {
  return (
    <footer
      className="border-t border-payo-border bg-white px-8 pt-[70px] pb-[25px] max-[700px]:px-5 max-[700px]:pt-[60px] max-[700px]:pb-[22px]"
      id="about"
    >
      <div className="m-auto grid max-w-[1280px] grid-cols-[2fr_1fr_1fr_1fr] gap-[50px] pb-[75px] max-[700px]:grid-cols-2 max-[700px]:gap-x-[30px] max-[700px]:gap-y-[45px] max-[700px]:pb-[50px]">
        <div className="max-[700px]:col-span-full">
          <Logo />
          <p className="mt-3 text-[9px] leading-[1.7] text-payo-muted">
            Pay together.
            <br />
            Stay organized.
          </p>
        </div>

        <div className={column}>
          <span className={columnTitle}>Product</span>
          <a href="#features" className={link}>
            Features
          </a>
          <a href="#how-it-works" className={link}>
            How it works
          </a>
          <Link href="/register" className={link}>
            Get started
          </Link>
        </div>

        <div className={column}>
          <span className={columnTitle}>Company</span>
          <a href="#about" className={link}>
            About
          </a>
          <Link href="/privacy" className={link}>
            Privacy
          </Link>
          <Link href="/terms" className={link}>
            Terms
          </Link>
        </div>

        <div className={column}>
          <span className={columnTitle}>Account</span>
          <Link href="/login" className={link}>
            Log in
          </Link>
          <Link href="/register" className={link}>
            Sign up
          </Link>
        </div>
      </div>

      <div className="m-auto flex max-w-[1280px] justify-between border-t border-payo-border pt-[22px] text-[8px] text-[#9aa1aa] max-[700px]:flex-col max-[700px]:gap-2.5">
        <span>© 2026 Payo. All rights reserved.</span>
        <span>University degree project.</span>
      </div>
    </footer>
  );
}
