"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Layers3,
  Plus,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";
import CtaBanner from "./CtaBanner";
import { cx } from "../ui/classes";

const features = [
  {
    icon: Users,
    title: "Create groups",
    text: "Create a group for trips, apartments, dinners, projects, or anything you share with others.",
  },
  { icon: ReceiptText, title: "Add expenses", text: "Record who paid, what it was for, and how much everyone owes." },
  {
    icon: Layers3,
    title: "Split automatically",
    text: "Payo calculates everyone's share so you don't have to do the math yourself.",
  },
  {
    icon: ShieldCheck,
    title: "Stay organized",
    text: "Keep expenses, balances, and settlements together in one simple place.",
  },
];

const steps = [
  { number: "01", title: "Create a group", text: "Start a shared space for your friends, roommates, trip, or project." },
  { number: "02", title: "Add your expenses", text: "Enter the expense and choose who participated." },
  { number: "03", title: "Settle up", text: "See exactly who owes whom and keep everything organized." },
];

/* Shared text styles */
const mono = "font-mono text-[11px] font-medium tracking-[0.12em]";
const h2 = "m-0 text-[clamp(38px,4vw,58px)] leading-none font-bold tracking-[-0.05em] max-[650px]:text-[42px] [&_em]:text-payo-green-dark [&_em]:not-italic";
const sectionEyebrow = cx(mono, "mb-[18px] block text-payo-light");
const sectionPad =
  "px-8 py-[130px] max-[800px]:py-[90px] max-[650px]:px-5";
const container = "mx-auto w-[min(100%,1280px)]";

/* Mini dashboard (static illustration in the hero) */
const miniIcon = "grid size-[31px] flex-none place-items-center rounded-[7px] bg-payo-bg text-payo-green-dark";
const miniCard = "rounded-[10px] border border-payo-border p-[17px]";
const miniRow = "flex items-center gap-2.5 border-t border-payo-border-soft py-[11px]";
const miniTitle = "block text-[10px] font-bold";
const miniSub = "mt-[3px] block text-[8px] text-payo-light";
const groupIcon = "grid size-7 place-items-center rounded-[7px] text-[9px] font-bold";

function DashboardPreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-[18px] border border-payo-border bg-white shadow-[0_25px_70px_rgba(17,24,39,0.07),0_4px_12px_rgba(17,24,39,0.03)]">
      <div className="flex h-[58px] items-center justify-between border-b border-payo-border px-5">
        <div className="flex items-center gap-2 font-display text-sm font-bold tracking-[-0.02em]">
          <span>
            <span>pay</span>
            <span className="font-bold text-payo-green">o</span>
            <span>.</span>
          </span>
        </div>
        <div className="grid size-[30px] place-items-center rounded-full bg-payo-green-soft font-mono text-[9px] text-payo-green-dark">
          JD
        </div>
      </div>

      <div className="p-[27px] max-[650px]:p-[18px]">
        <div className="flex items-center justify-between gap-5 max-[650px]:flex-col max-[650px]:items-start">
          <div>
            <span className={cx(mono, "mb-1.5 block !text-[8px] text-payo-light")}>YOUR OVERVIEW</span>
            <h3 className="m-0 text-[19px] font-bold tracking-[-0.03em]">Good morning, John</h3>
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="flex items-center gap-1.5 rounded-[7px] border border-payo-border bg-white px-3 py-[9px] text-[10px] font-semibold text-payo-text"
          >
            <Plus size={15} />
            Add expense
          </button>
        </div>

        <div className="mt-[22px] grid grid-cols-[1.3fr_1fr_1fr] gap-2.5 max-[650px]:grid-cols-1 [&_small]:block [&_small]:text-[9px] [&_small]:text-payo-light [&_span]:block [&_span]:text-[9px] [&_span]:text-payo-light [&_strong]:my-[7px] [&_strong]:block [&_strong]:text-[22px] [&_strong]:tracking-[-0.04em]">
          <div className={cx(miniCard, "!border-[#d8f0e2] bg-payo-green-soft [&_strong]:text-payo-green-dark")}>
            <span>Total balance</span>
            <strong>€124.50</strong>
            <small className="!text-payo-green-dark">You are owed €124.50</small>
          </div>
          <div className={miniCard}>
            <span>You owe</span>
            <strong>€42.00</strong>
            <small>3 people</small>
          </div>
          <div className={miniCard}>
            <span>You&apos;re owed</span>
            <strong>€166.50</strong>
            <small>5 people</small>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-[1.35fr_1fr] gap-2.5 max-[650px]:grid-cols-1">
          <div className={miniCard}>
            <div className="mb-[11px] flex items-center justify-between text-[11px] font-bold">
              <span>Recent activity</span>
              <button type="button" tabIndex={-1} className="p-0 text-[9px] text-payo-green-dark">
                View all
              </button>
            </div>
            {[
              { icon: CreditCard, title: "Apartment groceries", sub: "Today · Apartment", price: "€48.20" },
              { icon: ReceiptText, title: "Dinner at Noma", sub: "Yesterday · Weekend trip", price: "€86.00" },
              { icon: WalletCards, title: "Taxi", sub: "Yesterday · Weekend trip", price: "€24.50" },
            ].map(({ icon: Icon, title, sub, price }) => (
              <div className={miniRow} key={title}>
                <div className={miniIcon}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <strong className={miniTitle}>{title}</strong>
                  <span className={miniSub}>{sub}</span>
                </div>
                <strong className="text-[10px]">{price}</strong>
              </div>
            ))}
          </div>

          <div className={miniCard}>
            <div className="mb-[11px] flex items-center justify-between text-[11px] font-bold">
              <span>Your groups</span>
              <button type="button" tabIndex={-1} className="p-0 text-[9px] text-payo-green-dark">
                See all
              </button>
            </div>
            {[
              { letter: "W", tone: "bg-[#e8f8ef] text-[#168b51]", name: "Weekend trip", members: "6 members" },
              { letter: "A", tone: "bg-[#edf3ff] text-[#4772c7]", name: "Apartment", members: "3 members" },
              { letter: "F", tone: "bg-[#fff3e7] text-[#bd7427]", name: "Football team", members: "12 members" },
            ].map((g) => (
              <div className="flex items-center gap-[9px] border-t border-payo-border-soft py-2.5" key={g.name}>
                <div className={cx(groupIcon, g.tone)}>{g.letter}</div>
                <div className="flex-1">
                  <strong className={miniTitle}>{g.name}</strong>
                  <span className={miniSub}>{g.members}</span>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Group illustration in the "how it works" section */
function GroupsPreview() {
  return (
    <div className="ml-auto max-w-[620px] rounded-[18px] border border-payo-border bg-payo-bg p-7 shadow-[0_20px_60px_rgba(17,24,39,0.05)] max-[650px]:p-[18px]">
      <div className="flex items-center justify-between gap-5 max-[650px]:flex-col max-[650px]:items-start">
        <div>
          <span className={cx(mono, "!text-[8px] text-payo-light")}>GROUP</span>
          <h3 className="mt-[7px] mb-0 text-[19px] font-bold tracking-[-0.035em]">Weekend in Prizren</h3>
        </div>
        <div className="flex items-center max-[650px]:-mt-[5px]">
          {["JD", "AM", "LK", "+3"].map((t) => (
            <span
              key={t}
              className="-ml-[5px] grid size-[31px] place-items-center rounded-full border-2 border-payo-bg bg-white font-mono text-[7px] text-payo-muted first:ml-0"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-[30px] flex items-center justify-between rounded-[11px] border border-[#dcefe3] bg-payo-green-soft p-5 max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[15px]">
        <div>
          <span className="block text-[9px] text-payo-green-dark">Total expenses</span>
          <strong className="mt-[5px] block text-[27px] tracking-[-0.05em] text-payo-green-dark">€642.80</strong>
        </div>
        <div className="flex items-center gap-[5px] rounded-md bg-white px-[9px] py-[7px] text-[9px] font-semibold text-payo-green-dark">
          <Check size={14} />6 members
        </div>
      </div>

      <div className="mt-3 rounded-[11px] border border-payo-border bg-white">
        {[
          { icon: ReceiptText, title: "Hotel", sub: "Paid by Dren", price: "€280.00" },
          { icon: CircleDollarSign, title: "Restaurant", sub: "Paid by Arta", price: "€186.50" },
          { icon: CreditCard, title: "Transport", sub: "Paid by Luan", price: "€176.30" },
        ].map(({ icon: Icon, title, sub, price }) => (
          <div
            key={title}
            className="flex items-center justify-between border-b border-payo-border-soft px-4 py-3.5 last:border-b-0"
          >
            <div className="flex items-center gap-2.5">
              <div className={miniIcon}>
                <Icon size={17} />
              </div>
              <div>
                <strong className={miniTitle}>{title}</strong>
                <span className={miniSub}>{sub}</span>
              </div>
            </div>
            <strong className="text-[10px]">{price}</strong>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-[11px] border border-payo-border bg-white p-4">
        <div>
          <span className="block text-[8px] text-payo-light">Suggested settlement</span>
          <strong className="mt-1 block text-[10px]">3 payments</strong>
        </div>
        <ArrowUpRight size={18} />
      </div>
    </div>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
    </svg>
  );
}

const heroButton =
  "inline-flex min-h-[50px] items-center justify-center gap-[9px] rounded-lg px-[18px] text-[13px] font-semibold no-underline transition-[transform,background,border-color] duration-[180ms] hover:-translate-y-0.5 max-[650px]:w-full";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden font-jakarta">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative px-8 pt-[100px] pb-[110px] max-[800px]:py-[90px] max-[650px]:px-5">
          <div className="mx-auto grid w-[min(100%,1280px)] grid-cols-[minmax(0,0.9fr)_minmax(500px,1.1fr)] items-center gap-20 max-[1100px]:grid-cols-1 max-[1100px]:gap-[60px]">
            <motion.div
              className="max-w-[570px] max-[1100px]:max-w-[700px]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <div className={cx(mono, "mb-[25px] inline-flex items-center gap-[9px] text-payo-green-dark")}>
                <span className="size-[7px] rounded-full bg-payo-green" />
                SIMPLE SHARED EXPENSES
              </div>

              <h1 className="m-0 text-[clamp(48px,5.2vw,76px)] leading-[0.98] font-bold tracking-[-0.055em] max-[650px]:text-[clamp(43px,13vw,62px)]">
                Split expenses.
                <br />
                <em className="text-payo-green-dark not-italic">Keep things simple.</em>
              </h1>

              <p className="mt-[30px] mb-0 max-w-[500px] text-base leading-[1.8] text-payo-muted max-[650px]:text-sm">
                Payo makes it easy to manage shared expenses, split bills, and keep track of who owes what.
              </p>

              <div className="mt-[34px] flex items-center gap-3 max-[650px]:flex-col max-[650px]:items-stretch">
                <Link href="/register" className={cx(heroButton, "bg-payo-green text-white hover:bg-payo-green-dark")}>
                  Get started
                  <ArrowUpRight size={17} />
                </Link>

                <a href="#how-it-works" className={cx(heroButton, "border border-payo-border bg-white hover:border-[#cbd0c9]")}>
                  See how it works
                  <ChevronRight size={16} />
                </a>
              </div>

              <div className="mt-[18px] flex items-center gap-[7px] text-[11px] text-payo-light [&>svg]:text-payo-green">
                <Check size={15} />
                Free to use · Built for groups
              </div>
            </motion.div>

            <motion.div
              className="min-w-0 max-[1100px]:max-w-[850px]"
              initial={{ opacity: 0, x: 35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        {/* Intro strip */}
        <section className="border-y border-payo-border bg-white">
          <div className="mx-auto grid min-h-[108px] w-[min(100%,1280px)] grid-cols-[180px_1fr_40px] items-center gap-[30px] px-8 max-[800px]:grid-cols-[1fr_30px] max-[800px]:gap-5 max-[800px]:py-[25px]">
            <span className={cx(mono, "text-payo-light max-[800px]:hidden")}>MADE FOR SHARED LIFE</span>
            <p className="m-0 max-w-[720px] text-[17px] leading-[1.55] tracking-[-0.02em] max-[800px]:text-[15px]">
              From weekend trips to monthly rent, Payo keeps every shared expense clear and organized.
            </p>
            <div className="flex justify-end text-payo-green-dark">
              <ArrowDownIcon />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={sectionPad} id="features">
          <div className={container}>
            <div className="mb-[55px] grid grid-cols-[1fr_390px] items-end gap-20 max-[800px]:grid-cols-1 max-[800px]:gap-[25px]">
              <div>
                <span className={sectionEyebrow}>WHAT YOU CAN DO</span>
                <h2 className={h2}>
                  Less calculating.
                  <br />
                  <em>More living.</em>
                </h2>
              </div>
              <p className="m-0 text-sm leading-[1.8] text-payo-muted">
                Everything you need to manage shared money without spreadsheets, notes, or awkward calculations.
              </p>
            </div>

            <div className="grid grid-cols-4 border-t border-l border-payo-border max-[1100px]:grid-cols-2 max-[650px]:grid-cols-1">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    className="relative min-h-[300px] border-r border-b border-payo-border bg-transparent p-[25px] transition-[background,transform] duration-200 hover:bg-white max-[650px]:min-h-[260px]"
                    key={feature.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                  >
                    <div className="font-mono text-[10px] text-payo-light">0{index + 1}</div>
                    <div className="mt-12 grid size-[43px] place-items-center rounded-[10px] border border-payo-border bg-white text-payo-green-dark">
                      <Icon size={21} strokeWidth={1.7} />
                    </div>
                    <h3 className="mt-5 mb-[9px] text-base font-bold tracking-[-0.025em]">{feature.title}</h3>
                    <p className="m-0 max-w-[250px] text-xs leading-[1.7] text-payo-muted">{feature.text}</p>
                    <span className="absolute right-[25px] bottom-[25px] text-payo-light">
                      <ArrowUpRight size={16} />
                    </span>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Product section */}
        <section className={cx(sectionPad, "border-y border-payo-border bg-white")} id="how-it-works">
          <div className={container}>
            <div className="grid grid-cols-[0.8fr_1.2fr] items-center gap-[100px] max-[1100px]:grid-cols-1 max-[1100px]:gap-[70px]">
              <motion.div
                className="max-w-[480px] max-[1100px]:max-w-[650px]"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className={sectionEyebrow}>YOUR MONEY, ORGANIZED</span>
                <h2 className={h2}>
                  Know exactly
                  <br />
                  <em>where you stand.</em>
                </h2>
                <p className="mt-7 mb-0 text-sm leading-[1.8] text-payo-muted">
                  Payo gives every group a clear overview of expenses, balances, members, and settlements. No more
                  wondering who paid for dinner or how much you owe.
                </p>

                <div className="mt-7 flex flex-col gap-[13px]">
                  {["Automatic balance calculations", "Shared group expense history", "Simple settlement overview"].map(
                    (text) => (
                      <div key={text} className="flex items-center gap-2.5 text-xs font-semibold">
                        <span className="grid size-[22px] place-items-center rounded-full bg-payo-green-soft text-payo-green-dark">
                          <Check size={14} />
                        </span>
                        {text}
                      </div>
                    )
                  )}
                </div>

                <Link
                  href="/register"
                  className="mt-[34px] inline-flex items-center gap-2 text-xs font-bold text-payo-green-dark no-underline hover:[&>svg]:translate-x-0.5 hover:[&>svg]:-translate-y-0.5"
                >
                  Start using Payo
                  <ArrowUpRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                className="min-w-0 max-[1100px]:w-full max-[1100px]:max-w-[700px]"
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <GroupsPreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className={sectionPad}>
          <div className={container}>
            <div className="mb-[70px]">
              <span className={sectionEyebrow}>HOW IT WORKS</span>
              <h2 className={h2}>
                Three steps.
                <br />
                <em>That&apos;s it.</em>
              </h2>
            </div>

            <div className="grid grid-cols-3 border-t border-payo-border max-[800px]:grid-cols-1">
              {steps.map((step, index) => (
                <motion.div
                  className="relative min-h-60 border-r border-b border-payo-border px-[30px] pt-[25px] pb-[30px] first:border-l max-[800px]:min-h-[200px] max-[800px]:border-l max-[650px]:p-[22px]"
                  key={step.number}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <span className="block font-mono text-[11px] text-payo-green-dark">{step.number}</span>
                  <div className="mt-[43px] mb-[27px] h-px w-[35px] bg-payo-green" />
                  <h3 className="m-0 text-lg font-bold tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-[11px] mb-0 max-w-[270px] text-xs leading-[1.7] text-payo-muted">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-8 pb-[130px] max-[800px]:pb-[90px] max-[650px]:px-5">
          <div className={container}>
            <CtaBanner />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
