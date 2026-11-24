"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const MotionLink = motion.create(Link);

export default function CtaBanner({
  eyebrow = "READY WHEN YOU ARE",
  title = (
    <>
      Make money between
      <br />
      friends <em>less complicated.</em>
    </>
  ),
  buttonText = "Get started with Payo",
  buttonHref = "/register",
}: {
  eyebrow?: string;
  title?: ReactNode;
  buttonText?: string;
  buttonHref?: string;
}) {
  return (
    <section className="px-8 pt-10 pb-[100px] max-[700px]:px-5 max-[700px]:pt-5 max-[700px]:pb-[75px]">
      <div className="relative m-auto flex min-h-[310px] max-w-[1280px] items-center justify-between overflow-hidden rounded-[22px] bg-payo-ink p-[60px] text-white before:absolute before:top-[-250px] before:right-[-190px] before:size-[500px] before:rounded-full before:border before:border-[rgba(32,184,107,0.25)] before:content-[''] after:absolute after:right-[-80px] after:bottom-[-230px] after:size-[300px] after:rounded-full after:border after:border-white/6 after:content-[''] max-[700px]:min-h-[330px] max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-[45px] max-[700px]:px-7 max-[700px]:py-[42px]">
        <div className="relative z-[2]">
          <span className="font-mono text-[9px] tracking-[1px] text-payo-green">{eyebrow}</span>
          <h2 className="mt-3.5 mb-0 text-[43px] leading-[1.1] font-bold tracking-[-2px] max-[700px]:text-[35px] max-[700px]:tracking-[-1.5px] [&_em]:text-payo-green [&_em]:not-italic">
            {title}
          </h2>
        </div>

        <MotionLink
          href={buttonHref}
          className="relative z-[3] inline-flex min-h-[47px] items-center justify-center gap-2.5 rounded-[10px] bg-payo-green px-[18px] text-[11px] font-bold text-white no-underline transition-[background] duration-200 hover:bg-payo-green-dark"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {buttonText}
          <ArrowRight size={16} strokeWidth={2} />
        </MotionLink>
      </div>
    </section>
  );
}
