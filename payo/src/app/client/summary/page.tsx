"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useWorkspace } from "@/components/dashboard/Workspace";
import { useExpenseActions } from "@/components/dashboard/useExpenseActions";
import {
  EmptyState,
  ErrorBanner,
  ExpenseRow,
  PageHeader,
  SkeletonRows,
  chart,
  page,
} from "@/components/dashboard/DashboardParts";
import { cx, form, panel, toneClass } from "@/components/ui/classes";
import { categoryFor, toneFor } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { monthKeyOf, monthLabel, monthlySummary, shiftMonth, type CategoryTotal } from "@/lib/summary";

const short = (cents: number) => formatCents(cents).replace(/\.00$/, "");

// Tooltip for the trend bars: shown above the bar, kept inside the card at both ends.
const trendTip =
  "hover:after:pointer-events-none hover:after:absolute hover:after:top-[-6px] hover:after:left-1/2 hover:after:z-20 hover:after:-translate-x-1/2 hover:after:-translate-y-full hover:after:rounded-lg hover:after:bg-payo-ink hover:after:px-2.5 hover:after:py-[7px] hover:after:text-xs hover:after:leading-[1.3] hover:after:font-semibold hover:after:whitespace-nowrap hover:after:text-white hover:after:shadow-[0_8px_20px_rgba(17,24,39,0.18)] hover:after:content-[attr(data-tip)] first:hover:after:left-0 first:hover:after:translate-x-0 last:hover:after:right-0 last:hover:after:left-auto last:hover:after:translate-x-0";

const trackTip =
  "hover:after:pointer-events-none hover:after:absolute hover:after:bottom-[calc(100%+8px)] hover:after:left-1/2 hover:after:z-20 hover:after:-translate-x-1/2 hover:after:rounded-lg hover:after:bg-payo-ink hover:after:px-2.5 hover:after:py-[7px] hover:after:text-xs hover:after:leading-[1.3] hover:after:font-semibold hover:after:whitespace-nowrap hover:after:text-white hover:after:shadow-[0_8px_20px_rgba(17,24,39,0.18)] hover:after:content-[attr(data-tip)]";

export default function SummaryPage() {
  const { groups, expenses, settlements, loading, error, refresh, userId, memberName } = useWorkspace();
  const { menuFor } = useExpenseActions();

  const currentKey = monthKeyOf(new Date());
  const [monthKey, setMonthKey] = useState(currentKey);
  const [groupId, setGroupId] = useState("all");
  const [metric, setMetric] = useState<"share" | "total">("share");

  const s = useMemo(
    () => monthlySummary({ groups, expenses, settlements }, userId, monthKey, groupId),
    [groups, expenses, settlements, userId, monthKey, groupId]
  );

  const catValue = (c: CategoryTotal) => (metric === "share" ? c.shareCents : c.totalCents);
  const catMax = Math.max(1, ...s.categories.map(catValue));
  const trendMax = Math.max(1, ...s.trend.map((t) => t.shareCents));
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name;

  const segBtn = (active: boolean) =>
    cx("h-[30px] rounded-lg px-2.5 text-xs font-bold text-payo-muted", active && form.segmentBtnActive);

  return (
    <>
      <PageHeader
        eyebrow="MONTHLY SUMMARY"
        title={
          <>
            {monthLabel(monthKey, { month: "long" })} <strong>{monthKey.slice(0, 4)}.</strong>
          </>
        }
        description="Where your shared money went this month."
        actions={
          <div className="flex flex-nowrap items-center gap-2 max-[760px]:w-full">
            <div
              className="inline-flex h-10 items-center overflow-hidden rounded-[10px] border border-payo-border bg-white [&>button]:flex [&>button]:h-full [&>button]:w-[38px] [&>button]:items-center [&>button]:justify-center [&>button]:text-payo-text [&>button:disabled]:cursor-not-allowed [&>button:disabled]:text-[#cdd2cb] [&>button:hover:not(:disabled)]:bg-[#f5f6f4]"
              role="group"
              aria-label="Choose month"
            >
              <button type="button" onClick={() => setMonthKey((k) => shiftMonth(k, -1))} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <span className="inline-flex min-w-28 items-center justify-center gap-1.5 border-x border-payo-border-soft px-1.5 text-[13px] font-bold whitespace-nowrap text-payo-ink">
                <CalendarRange size={14} />
                {monthLabel(monthKey, { month: "short", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={() => setMonthKey((k) => shiftMonth(k, 1))}
                disabled={monthKey >= currentKey}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <select
              className={cx(
                form.select,
                "!h-10 !w-[170px] flex-none !text-[13px] max-[760px]:!w-auto max-[760px]:min-w-0 max-[760px]:flex-[1_1_120px]"
              )}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              aria-label="Group"
            >
              <option value="all">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <ErrorBanner message={error} onRetry={refresh} />

      {/* KPI tiles */}
      <section className={chart.stats}>
        <div className={cx(page.balanceCard, chart.statCard, page.balanceMain)}>
          <div className={page.cardTopDark}>
            <span>Your spending</span>
            <div className={page.cardIcon}>
              <Wallet size={17} />
            </div>
          </div>
          <div className={cx(page.smallValue, "!text-white")}>{loading ? "—" : formatCents(s.myShareCents)}</div>
          <p className={page.cardDescription}>
            {s.changePct === null ? (
              "Your share of expenses"
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-[#cfd5de]">
                {s.changePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {s.changePct >= 0 ? "+" : ""}
                {s.changePct}% vs {monthLabel(shiftMonth(monthKey, -1), { month: "short" })}
              </span>
            )}
          </p>
        </div>

        <div className={cx(page.balanceCard, chart.statCard)}>
          <div className={page.cardTop}>
            <span>Group spending</span>
            <div className={page.cardIcon}>
              <ReceiptText size={17} />
            </div>
          </div>
          <div className={page.smallValue}>{loading ? "—" : formatCents(s.totalCents)}</div>
          <p className={page.cardDescription}>
            {s.count} expense{s.count === 1 ? "" : "s"} in{" "}
            {groupId === "all" ? `${s.groups.length} group${s.groups.length === 1 ? "" : "s"}` : groupName(groupId)}
          </p>
        </div>

        <div className={cx(page.balanceCard, chart.statCard)}>
          <div className={page.cardTop}>
            <span>You paid</span>
            <div className={page.cardIconGreen}>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className={page.smallValue}>{loading ? "—" : formatCents(s.paidCents)}</div>
          <p className={page.cardDescription}>
            Balance effect{" "}
            <b className={s.netCents > 0 ? page.positive : s.netCents < 0 ? page.negative : ""}>
              {formatCents(s.netCents, "EUR", { sign: true })}
            </b>
          </p>
        </div>

        <div className={cx(page.balanceCard, chart.statCard, "max-[760px]:col-span-full")}>
          <div className={page.cardTop}>
            <span>Settled up</span>
            <div className={page.cardIcon}>
              <HandCoins size={17} />
            </div>
          </div>
          <div className={page.smallValue}>{loading ? "—" : s.paymentsCount}</div>
          <p className={cx(page.cardDescription, "flex flex-wrap gap-2.5 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[3px]")}>
            <span>
              <ArrowUpRight size={12} /> paid {formatCents(s.settledOutCents)}
            </span>
            <span>
              <ArrowDownLeft size={12} /> got {formatCents(s.settledInCents)}
            </span>
          </p>
        </div>
      </section>

      {loading ? (
        <div className={panel.panelVisible}>
          <SkeletonRows count={5} />
        </div>
      ) : (
        <>
          <section className={page.contentGrid}>
            {/* By category */}
            <div className={panel.panelVisible}>
              <div className={panel.header}>
                <div>
                  <h2 className={panel.title}>By category</h2>
                  <p className={panel.subtitle}>
                    {metric === "share" ? "Your share of each category" : "Everything the group spent"}
                  </p>
                </div>
                <div className={form.segment}>
                  <button type="button" className={segBtn(metric === "share")} onClick={() => setMetric("share")}>
                    Your share
                  </button>
                  <button type="button" className={segBtn(metric === "total")} onClick={() => setMetric("total")}>
                    Group total
                  </button>
                </div>
              </div>

              {s.categories.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No expenses this month"
                  text="Pick another month, or add an expense."
                />
              ) : (
                <ul className="m-0 list-none py-1.5">
                  {s.categories.map((c) => {
                    const cat = categoryFor(c.category);
                    const Icon = cat.icon;
                    const value = catValue(c);
                    const base = metric === "share" ? s.myShareCents : s.totalCents;
                    const pct = base ? Math.round((value / base) * 100) : 0;
                    return (
                      <li key={c.category} className="flex items-center gap-3 px-[19px] py-2.5">
                        <span className="flex size-[33px] flex-[0_0_33px] items-center justify-center rounded-lg bg-[#f5f6f4] text-payo-muted">
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-[7px] flex justify-between gap-2.5 text-[13px]">
                            <strong className="font-bold text-payo-text">{cat.label}</strong>
                            <span className="whitespace-nowrap text-payo-muted">
                              <b className="font-[750] text-payo-ink">{formatCents(value)}</b> · {pct}%
                            </span>
                          </div>
                          <div
                            className={cx("relative h-2 rounded bg-[#f2f3f1]", trackTip)}
                            data-tip={`${cat.label}: ${formatCents(value)} (${c.count} expense${c.count === 1 ? "" : "s"})`}
                          >
                            <span
                              className="block h-full min-w-1 rounded bg-payo-green transition-[width] duration-[400ms] ease-in-out"
                              style={{ width: `${(value / catMax) * 100}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3.5">
              {/* Last 6 months */}
              <div className={panel.panelVisible}>
                <div className={panel.header}>
                  <div>
                    <h2 className={panel.title}>Your spending, 6 months</h2>
                    <p className={panel.subtitle}>Your share per month</p>
                  </div>
                </div>
                <div
                  className={chart.wrap}
                  role="img"
                  aria-label="Your spending per month for the last 6 months"
                >
                  {s.trend.map((t) => {
                    const selected = t.key === monthKey;
                    return (
                      <button
                        type="button"
                        key={t.key}
                        className={cx(chart.col, "relative rounded-lg p-0", trendTip)}
                        onClick={() => setMonthKey(t.key)}
                        data-tip={`${monthLabel(t.key, { month: "long" })}: ${formatCents(t.shareCents)} your share · ${formatCents(t.totalCents)} group`}
                        aria-label={`${monthLabel(t.key)}: ${formatCents(t.shareCents)}`}
                      >
                        <span className={chart.value}>{t.shareCents ? short(t.shareCents) : ""}</span>
                        <div className={cx(chart.track, "group-hover/col:bg-[#eceeea]")}>
                          <div
                            className={cx(chart.bar, selected && "!bg-payo-ink")}
                            style={{
                              height: `${t.shareCents ? Math.max((t.shareCents / trendMax) * 100, 3) : 0}%`,
                            }}
                          />
                        </div>
                        <span className={cx(chart.label, selected && "!font-extrabold !text-payo-ink")}>
                          {monthLabel(t.key, { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* By group */}
              {groupId === "all" && s.groups.length > 0 && (
                <div className={panel.panel}>
                  <div className={panel.header}>
                    <div>
                      <h2 className={panel.title}>By group</h2>
                      <p className={panel.subtitle}>Group total and your share</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {s.groups.map((g) => (
                      <div key={g.groupId} className={cx(page.groupCard, "hover:!bg-transparent")}>
                        <div className={cx(page.groupCardAvatar, toneClass[toneFor(g.groupId)])}>
                          {g.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={page.groupCardInfo}>
                          <strong>{g.name}</strong>
                          <span>
                            {g.count} expense{g.count === 1 ? "" : "s"} · your share {formatCents(g.shareCents)}
                          </span>
                        </div>
                        <div className={page.groupBalance}>{formatCents(g.totalCents)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* This month's expenses */}
          <section className={cx(panel.panelVisible, "mt-3.5")}>
            <div className={panel.header}>
              <div>
                <h2 className={panel.title}>Expenses in {monthLabel(monthKey, { month: "long" })}</h2>
                <p className={panel.subtitle}>
                  {s.biggest
                    ? `Biggest: ${s.biggest.description} (${formatCents(Math.round(Number(s.biggest.amount) * 100))})`
                    : "Nothing recorded this month"}
                </p>
              </div>
            </div>
            {s.expenses.length === 0 ? (
              <EmptyState icon={CalendarRange} title="No expenses this month" />
            ) : (
              <div className="flex flex-col">
                {s.expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    userId={userId}
                    groupName={groupName(expense.group_id)}
                    memberName={memberName}
                    menuItems={menuFor(expense)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
