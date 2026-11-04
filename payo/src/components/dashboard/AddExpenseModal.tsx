"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Users } from "lucide-react";

import Modal from "../ui/Modal";
import { avatar, btn, cx, form } from "../ui/classes";
import { useToast } from "../providers/ToastProvider";
import { useWorkspace } from "./Workspace";
import { createExpense } from "@/lib/supabase/api";
import { CATEGORIES, initials, todayISO } from "@/lib/format";
import { currencySymbol, formatCents, fromCents, parseAmount, splitEqually, toCents } from "@/lib/money";
import type { GroupMember } from "@/lib/types";

type SplitMode = "equal" | "exact";

const splitRow =
  "flex min-h-[52px] cursor-pointer items-center gap-[11px] border-b border-payo-border-soft px-3 py-2 last:border-b-0";

export default function AddExpenseModal() {
  const { expenseModal, closeAddExpense, groups, members, userId, refresh, openGroupModal } = useWorkspace();
  const toast = useToast();

  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("general");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [selected, setSelected] = useState<string[]>([]);
  const [exact, setExact] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const groupMembers = useMemo(() => members.filter((m) => m.group_id === groupId), [members, groupId]);
  const group = groups.find((g) => g.id === groupId);
  const currency = group?.currency || "EUR";

  // Reset when the modal opens
  useEffect(() => {
    if (!expenseModal.open) return;
    const initialGroup = expenseModal.groupId || groups[0]?.id || "";
    setGroupId(initialGroup);
    setDescription("");
    setAmount("");
    setDate(todayISO());
    setCategory("general");
    setMode("equal");
    setExact({});
    setError("");
  }, [expenseModal.open, expenseModal.groupId, groups]);

  // Reset participants when the group changes
  useEffect(() => {
    setSelected(groupMembers.map((m) => m.user_id));
    setPaidBy(
      groupMembers.some((m) => m.user_id === userId) ? (userId as string) : groupMembers[0]?.user_id || ""
    );
    setExact({});
  }, [groupMembers, userId]);

  const totalCents = toCents(parseAmount(amount) || 0);

  // Members in join order -> deterministic distribution of leftover cents (see splitEqually)
  const equalParts = useMemo(() => {
    const ordered = groupMembers.map((m) => m.user_id).filter((id) => selected.includes(id));
    return splitEqually(totalCents, ordered);
  }, [groupMembers, selected, totalCents]);

  const exactCents = useMemo(() => {
    const out: Record<string, number> = {};
    Object.entries(exact).forEach(([id, v]) => {
      const n = parseAmount(v);
      if (v !== "" && !Number.isNaN(n) && n > 0) out[id] = toCents(n);
    });
    return out;
  }, [exact]);

  const exactSum = Object.values(exactCents).reduce((s, n) => s + n, 0);
  const remaining = totalCents - exactSum;

  const nameOf = (m: GroupMember) =>
    m.user_id === userId ? "You" : m.profile?.full_name || m.profile?.email || "Member";

  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const value = parseAmount(amount);
    if (!groupId) return setError("Choose a group.");
    if (!description.trim()) return setError("Add a short description, like “Dinner” or “Taxi”.");
    if (Number.isNaN(value) || value <= 0) return setError("Enter a valid amount, e.g. 24.50");
    if (!paidBy) return setError("Choose who paid.");

    let parts: Record<string, number>;
    if (mode === "equal") {
      if (!selected.length) return setError("Pick at least one person to split with.");
      parts = equalParts;
    } else {
      if (!Object.keys(exactCents).length) return setError("Enter at least one person’s share.");
      if (remaining !== 0) {
        return setError(
          remaining > 0
            ? `${formatCents(remaining, currency)} still needs to be assigned.`
            : `Shares are ${formatCents(-remaining, currency)} over the total.`
        );
      }
      parts = exactCents;
    }

    const splits = Object.entries(parts)
      .filter(([, cents]) => cents > 0)
      .map(([user_id, cents]) => ({ user_id, amount: fromCents(cents) }));

    setSaving(true);
    try {
      await createExpense({
        groupId,
        description: description.trim(),
        amount: fromCents(totalCents),
        paidBy,
        splits,
        category,
        date,
      });
      toast.success(`Added “${description.trim()}”`);
      closeAddExpense();
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (expenseModal.open && groups.length === 0) {
    return (
      <Modal open onClose={closeAddExpense} title="Add an expense">
        <div className="flex flex-col items-center gap-2.5 py-2.5 text-center">
          <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-payo-green-soft text-payo-green-dark">
            <Users size={20} />
          </span>
          <p className="mt-0 mb-1.5 max-w-[340px] text-sm leading-normal text-payo-muted">
            Expenses live inside groups. Create your first group, or join one with an invite code.
          </p>
          <button
            type="button"
            className={btn.primary}
            onClick={() => {
              closeAddExpense();
              openGroupModal("create");
            }}
          >
            Create a group
          </button>
        </div>
      </Modal>
    );
  }

  const perPersonLabel = () => {
    if (!selected.length || !totalCents) return "";
    const low = Math.floor(totalCents / selected.length);
    if (totalCents % selected.length === 0) return `${formatCents(low, currency)} each`;
    // Uneven split: some people pay one extra cent (see splitEqually)
    return `${formatCents(low, currency)}–${formatCents(low + 1, currency)} each`;
  };

  const segBtn = (active: boolean) =>
    cx(form.segmentBtn, active && form.segmentBtnActive);

  return (
    <Modal
      open={expenseModal.open}
      onClose={closeAddExpense}
      title="Add an expense"
      subtitle="Record who paid and how it’s shared."
      width={560}
      footer={
        <>
          <button type="button" className={btn.ghost} onClick={closeAddExpense}>
            Cancel
          </button>
          <button type="submit" form="add-expense-form" className={btn.primary} disabled={saving}>
            {saving ? "Saving…" : "Save expense"}
          </button>
        </>
      }
    >
      <form id="add-expense-form" className={form.form} onSubmit={handleSubmit} noValidate>
        {error && (
          <div className={form.error} role="alert">
            {error}
          </div>
        )}

        <div className={form.row}>
          <label className={form.field}>
            <span className={form.label}>Group</span>
            <select className={form.select} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <label className={form.field}>
            <span className={form.label}>Category</span>
            <select className={form.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={form.field}>
          <span className={form.label}>Description</span>
          <input
            className={form.input}
            placeholder="e.g. Dinner at Artigiano"
            value={description}
            maxLength={100}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />
        </label>

        <div className={form.row}>
          <label className={form.field}>
            <span className={form.label}>Amount</span>
            <div className={form.money}>
              <span className={form.moneySign}>{currencySymbol(currency)}</span>
              <input
                className={cx(form.input, form.moneyInput)}
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </label>

          <label className={form.field}>
            <span className={form.label}>Date</span>
            <input
              className={form.input}
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <label className={form.field}>
          <span className={form.label}>Paid by</span>
          <select className={form.select} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {groupMembers.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {nameOf(m)}
              </option>
            ))}
          </select>
        </label>

        <div className={form.field}>
          <div className="flex items-center justify-between gap-2.5">
            <span className={form.label}>Split</span>
            <div className={form.segment} role="tablist">
              <button type="button" className={segBtn(mode === "equal")} onClick={() => setMode("equal")}>
                Equally
              </button>
              <button type="button" className={segBtn(mode === "exact")} onClick={() => setMode("exact")}>
                Exact amounts
              </button>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-payo-border">
            {groupMembers.map((m) =>
              mode === "equal" ? (
                <label className={splitRow} key={m.user_id}>
                  <input
                    type="checkbox"
                    className={cx(form.checkbox, "cursor-pointer")}
                    checked={selected.includes(m.user_id)}
                    onChange={() => toggle(m.user_id)}
                  />
                  <span className={avatar}>{initials(m.profile?.full_name || m.profile?.email)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-payo-text">{nameOf(m)}</span>
                  <span className="text-[13px] font-bold whitespace-nowrap text-payo-muted">
                    {selected.includes(m.user_id) ? formatCents(equalParts[m.user_id] || 0, currency) : "—"}
                  </span>
                </label>
              ) : (
                <div className={splitRow} key={m.user_id}>
                  <span className={avatar}>{initials(m.profile?.full_name || m.profile?.email)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-payo-text">{nameOf(m)}</span>
                  <input
                    className={cx(form.input, "!h-9 !w-[110px] text-right")}
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label={`${nameOf(m)}'s share`}
                    value={exact[m.user_id] ?? ""}
                    onChange={(e) => setExact((x) => ({ ...x, [m.user_id]: e.target.value }))}
                  />
                </div>
              )
            )}
          </div>

          {mode === "equal" ? (
            <div className="flex justify-between text-xs font-semibold text-payo-muted">
              <span>
                {selected.length} of {groupMembers.length} people
              </span>
              <span>{perPersonLabel()}</span>
            </div>
          ) : (
            <div className="flex justify-between text-xs font-semibold text-payo-muted">
              <span>
                {formatCents(exactSum, currency)} of {formatCents(totalCents, currency)}
              </span>
              <span className={remaining === 0 && totalCents > 0 ? "text-payo-green-dark" : "text-[#b84343]"}>
                {remaining === 0
                  ? totalCents > 0
                    ? "All assigned"
                    : ""
                  : remaining > 0
                    ? `${formatCents(remaining, currency)} left`
                    : `${formatCents(-remaining, currency)} over`}
              </span>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
