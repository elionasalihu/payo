"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Crown,
  DoorOpen,
  HandCoins,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import Modal from "@/components/ui/Modal";
import { useWorkspace } from "@/components/dashboard/Workspace";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useExpenseActions } from "@/components/dashboard/useExpenseActions";
import {
  AvatarStack,
  EmptyState,
  ErrorBanner,
  ExpenseRow,
  PageHeader,
  RowMenu,
  SkeletonRows,
  page,
} from "@/components/dashboard/DashboardParts";
import { btn, cx, form, iconBtn, panel, toneClass, btnSm } from "@/components/ui/classes";
import {
  addMemberByEmail,
  createSettlement,
  deleteGroup,
  deleteSettlement,
  leaveGroup,
  removeMember,
  updateGroup,
} from "@/lib/supabase/api";
import { friendlyDate, initials, toneFor } from "@/lib/format";
import { currencySymbol, formatCents, fromCents, parseAmount, toCents } from "@/lib/money";
import type { Payment } from "@/lib/balances";
import type { Group, GroupMember, Settlement } from "@/lib/types";

const panelSegmentBtn = (active: boolean) =>
  cx("h-[30px] rounded-lg px-2.5 text-xs font-bold text-payo-muted", active && form.segmentBtnActive);

// "Record a payment": logs money paid back outside Payo. It does not move money.
function SettleModal({
  open,
  onClose,
  group,
  members,
  preset,
  userId,
  memberName,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  group: Group;
  members: GroupMember[];
  preset: Payment | null;
  userId: string | undefined;
  memberName: (id: string) => string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFrom(preset?.from || userId || "");
    setTo(preset?.to || members.find((m) => m.user_id !== userId)?.user_id || "");
    setAmount(preset?.cents ? fromCents(preset.cents).toFixed(2) : "");
    setError("");
  }, [open, preset, members, userId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    if (!from || !to) return setError("Choose who paid and who received.");
    if (from === to) return setError("Payer and receiver must be different people.");
    if (Number.isNaN(value) || value <= 0) return setError("Enter a valid amount.");
    setSaving(true);
    try {
      await createSettlement({ groupId: group.id, fromUser: from, toUser: to, amount: value, createdBy: userId as string });
      toast.success(`Recorded ${formatCents(toCents(value), group.currency)} payment`);
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a payment"
      subtitle="Log money paid back outside Payo (cash, bank transfer…)."
      width={460}
      footer={
        <>
          <button type="button" className={btn.ghost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="settle-form" className={btn.green} disabled={saving}>
            {saving ? "Saving…" : "Record payment"}
          </button>
        </>
      }
    >
      <form id="settle-form" className={form.form} onSubmit={submit} noValidate>
        {error && (
          <div className={form.error} role="alert">
            {error}
          </div>
        )}
        <div className={form.row}>
          <label className={form.field}>
            <span className={form.label}>From</span>
            <select className={form.select} value={from} onChange={(e) => setFrom(e.target.value)}>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {memberName(m.user_id)}
                </option>
              ))}
            </select>
          </label>
          <label className={form.field}>
            <span className={form.label}>To</span>
            <select className={form.select} value={to} onChange={(e) => setTo(e.target.value)}>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {memberName(m.user_id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={form.field}>
          <span className={form.label}>Amount</span>
          <div className={form.money}>
            <span className={form.moneySign}>{currencySymbol(group.currency)}</span>
            <input
              className={cx(form.input, form.moneyInput)}
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </label>
      </form>
    </Modal>
  );
}

function EditGroupModal({
  open,
  onClose,
  group,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  group: Group;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(group.name);
    setDescription(group.description || "");
    setError("");
  }, [open, group]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Group name can’t be empty.");
    setSaving(true);
    try {
      await updateGroup(group.id, { name: name.trim(), description: description.trim() });
      toast.success("Group updated");
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit group"
      width={480}
      footer={
        <>
          <button type="button" className={btn.ghost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-group-form" className={btn.primary} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form id="edit-group-form" className={form.form} onSubmit={submit} noValidate>
        {error && (
          <div className={form.error} role="alert">
            {error}
          </div>
        )}
        <label className={form.field}>
          <span className={form.label}>Group name</span>
          <input
            className={form.input}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <label className={form.field}>
          <span className={form.label}>
            Description <span className={form.hint}>(optional)</span>
          </span>
          <input
            className={form.input}
            maxLength={140}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { summary, loading, error, refresh, userId, memberName, openAddExpense } = useWorkspace();
  const { menuFor } = useExpenseActions();

  const info = summary.byGroup[groupId];
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settle, setSettle] = useState<{ open: boolean; preset: Payment | null }>({ open: false, preset: null });
  const [tab, setTab] = useState<"expenses" | "payments">("expenses");
  const [editOpen, setEditOpen] = useState(false);

  const isOwner = Boolean(info?.members.some((m) => m.user_id === userId && m.role === "owner"));

  const memberRows = useMemo(() => {
    if (!info) return [];
    return [...info.members].sort((a, b) => (info.net[b.user_id] || 0) - (info.net[a.user_id] || 0));
  }, [info]);

  if (loading) {
    return (
      <div className={panel.panelVisible}>
        <SkeletonRows count={5} />
      </div>
    );
  }

  if (!info) {
    return (
      <div className={panel.panelVisible}>
        <EmptyState
          icon={Users}
          title="Group not found"
          text="It may have been deleted, or you’re no longer a member."
          action={
            <Link href="/client/groups" className={btnSm.primary}>
              Back to groups
            </Link>
          }
        />
      </div>
    );
  }

  const { group, members, expenses, settlements, net, payments, totalCents, myNet } = info;
  const cur = group.currency;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn’t copy. Select the code and copy it manually.");
    }
  };

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const added = await addMemberByEmail(group.id, inviteEmail.trim());
      toast.success(`${added.full_name || added.email} added to the group`);
      setInviteEmail("");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  const kick = async (member: GroupMember) => {
    const bal = net[member.user_id] || 0;
    const ok = await confirm({
      title: `Remove ${member.profile?.full_name}?`,
      message:
        bal !== 0
          ? `They still have an open balance of ${formatCents(bal, cur, { sign: true })}. Their past expenses stay in the group.`
          : "Their past expenses stay in the group history.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await removeMember(group.id, member.user_id);
      toast.success("Member removed");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const leave = async () => {
    const ok = await confirm({
      title: "Leave this group?",
      message:
        myNet !== 0
          ? `You still have an open balance of ${formatCents(myNet, cur, { sign: true })}. Consider settling up first.`
          : members.length === 1
            ? "You’re the last member, so the group and its history will be deleted."
            : isOwner
              ? "Ownership will pass to the next longest-standing member."
              : "You can rejoin later with the invite code.",
      confirmLabel: "Leave group",
      danger: true,
    });
    if (!ok) return;
    try {
      await leaveGroup(group.id);
      toast.success(`You left “${group.name}”`);
      await refresh();
      router.push("/client/groups");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const destroy = async () => {
    const ok = await confirm({
      title: "Delete group?",
      message: `“${group.name}” and all ${expenses.length} expenses and ${settlements.length} payments will be deleted for everyone. This can’t be undone.`,
      confirmLabel: "Delete group",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteGroup(group.id);
      toast.success("Group deleted");
      await refresh();
      router.push("/client/groups");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const undoSettlement = async (s: Settlement) => {
    const ok = await confirm({
      title: "Delete payment?",
      message: `${memberName(s.from_user)} → ${memberName(s.to_user)}, ${formatCents(toCents(s.amount), cur)}. Balances will be recalculated.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteSettlement(s.id);
      toast.success("Payment deleted");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const balanceClass = (bal: number) =>
    cx(page.groupBalance, bal > 0 ? "text-payo-green" : bal < 0 ? "text-payo-red" : "!font-semibold text-payo-light");

  return (
    <>
      <PageHeader
        back={
          <Link href="/client/groups" className={page.back}>
            <ArrowLeft size={14} /> Groups
          </Link>
        }
        eyebrow="GROUP"
        title={<strong>{group.name}</strong>}
        description={
          group.description ||
          `${members.length} member${members.length === 1 ? "" : "s"} · created ${friendlyDate(group.created_at)}`
        }
        actions={
          <>
            {isOwner && (
              <button type="button" className={btn.ghost} onClick={() => setEditOpen(true)} aria-label="Edit group">
                <Pencil size={15} />
                <span className={page.hideSm}>Edit</span>
              </button>
            )}
            <button
              type="button"
              className={btn.ghost}
              onClick={() => setSettle({ open: true, preset: null })}
              disabled={members.length < 2}
            >
              <HandCoins size={15} />
              <span className={page.hideSm}>Record payment</span>
            </button>
            <button type="button" className={page.headerAdd} onClick={() => openAddExpense(group.id)}>
              <Plus size={16} />
              Add expense
            </button>
          </>
        }
      />

      <ErrorBanner message={error} onRetry={refresh} />

      <section className={page.balanceGrid}>
        <div className={cx(page.balanceCard, page.balanceMain)}>
          <div className={page.cardTopDark}>
            <span>Your balance</span>
            <div className={page.cardIcon}>
              <HandCoins size={17} />
            </div>
          </div>
          <div className={page.balanceValue}>{myNet === 0 ? "Settled" : formatCents(myNet, cur, { sign: true })}</div>
          <div className={page.balanceFooter}>
            <span>{myNet > 0 ? "The group owes you" : myNet < 0 ? "You owe the group" : "You’re all square"}</span>
          </div>
        </div>
        <div className={page.balanceCard}>
          <div className={page.cardTop}>
            <span>Total spent</span>
            <div className={page.cardIcon}>
              <ReceiptText size={17} />
            </div>
          </div>
          <div className={page.smallValue}>{formatCents(totalCents, cur)}</div>
          <p className={page.cardDescription}>
            {expenses.length} expense{expenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className={page.balanceCard}>
          <div className={page.cardTop}>
            <span>Members</span>
            <div className={page.cardIconGreen}>
              <Users size={17} />
            </div>
          </div>
          <div className={page.smallValue}>{members.length}</div>
          <AvatarStack
            small
            max={5}
            names={members.map((m) => ({ key: m.user_id, label: initials(m.profile?.full_name || m.profile?.email) }))}
          />
        </div>
      </section>

      <section className={page.contentGrid}>
        {/* Left: expenses and payments */}
        <div className={panel.panelVisible}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>History</h2>
              <p className={panel.subtitle}>Expenses and payments in this group</p>
            </div>
            <div className={form.segment}>
              <button type="button" className={panelSegmentBtn(tab === "expenses")} onClick={() => setTab("expenses")}>
                Expenses ({expenses.length})
              </button>
              <button type="button" className={panelSegmentBtn(tab === "payments")} onClick={() => setTab("payments")}>
                Payments ({settlements.length})
              </button>
            </div>
          </div>

          {tab === "expenses" ? (
            expenses.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No expenses yet"
                text={
                  members.length < 2
                    ? "Invite someone first, then start adding shared costs."
                    : "Add the first shared cost for this group."
                }
                action={
                  <button type="button" className={btnSm.primary} onClick={() => openAddExpense(group.id)}>
                    <Plus size={14} /> Add expense
                  </button>
                }
              />
            ) : (
              <div className="flex flex-col">
                {expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    userId={userId}
                    memberName={memberName}
                    currency={cur}
                    menuItems={menuFor(expense, { showGroupLink: false })}
                  />
                ))}
              </div>
            )
          ) : settlements.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No payments yet"
              text="When someone pays back what they owe, record it here."
            />
          ) : (
            <div className="flex flex-col">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  className="flex min-h-[67px] items-center gap-[11px] border-b border-payo-border-soft px-[19px] py-2.5 last:border-b-0 max-[760px]:px-[15px]"
                >
                  <div
                    className={cx(
                      "flex size-[33px] flex-[0_0_33px] items-center justify-center rounded-lg",
                      toneClass.green
                    )}
                  >
                    <HandCoins size={17} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="truncate text-xs font-bold text-[#344054]">
                      {memberName(s.from_user)} paid {memberName(s.to_user)}
                    </strong>
                    <span className="truncate text-[11px] font-medium text-payo-light">
                      {friendlyDate(s.created_at)}
                      {s.note ? ` · ${s.note}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                    <strong className="text-xs font-[750] text-payo-green">{formatCents(toCents(s.amount), cur)}</strong>
                    <span className="text-[11px] font-medium text-payo-light">payment</span>
                  </div>
                  <RowMenu
                    items={[
                      (s.created_by === userId || isOwner) && {
                        label: "Delete",
                        icon: Trash2,
                        danger: true,
                        onClick: () => undoSettlement(s),
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: settle up, members, invite */}
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className={panel.panel}>
            <div className={panel.header}>
              <div>
                <h2 className={panel.title}>Settle up</h2>
                <p className={panel.subtitle}>Fewest payments to clear all debts</p>
              </div>
            </div>
            {payments.length === 0 ? (
              <div className="flex items-center gap-2.5 px-[17px] py-[18px] text-[13px] font-semibold text-payo-muted">
                <span className="flex size-7 items-center justify-center rounded-lg bg-payo-green-soft text-payo-green-dark">
                  <Check size={16} />
                </span>
                Everyone is settled up.
              </div>
            ) : (
              <div className="flex flex-col">
                {payments.map((p) => (
                  <div
                    key={`${p.from}-${p.to}`}
                    className={cx(
                      "flex items-center gap-2.5 border-b border-payo-border-soft px-[17px] py-[11px] last:border-b-0",
                      (p.from === userId || p.to === userId) && "bg-[#f6fcf8]"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-payo-muted [&>strong]:truncate [&>strong]:font-bold [&>strong]:text-payo-text">
                      <strong>{memberName(p.from)}</strong>
                      <ArrowRight size={13} />
                      <strong>{memberName(p.to)}</strong>
                    </div>
                    <span className="text-[13px] font-extrabold whitespace-nowrap text-payo-ink">
                      {formatCents(p.cents, cur)}
                    </span>
                    <button
                      type="button"
                      className={btnSm.ghost}
                      onClick={() => setSettle({ open: true, preset: p })}
                    >
                      Settle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={panel.panel}>
            <div className={panel.header}>
              <div>
                <h2 className={panel.title}>Members</h2>
                <p className={panel.subtitle}>Balances within this group</p>
              </div>
            </div>

            <div className="flex flex-col">
              {memberRows.map((m) => {
                const bal = net[m.user_id] || 0;
                return (
                  <div key={m.user_id} className={cx(page.groupCard, "hover:!bg-transparent")}>
                    <div className={cx(page.groupCardAvatar, toneClass[toneFor(m.user_id)])}>
                      {initials(m.profile?.full_name || m.profile?.email)}
                    </div>
                    <div className={page.groupCardInfo}>
                      <strong>
                        {m.user_id === userId ? `${m.profile?.full_name || "You"} (you)` : m.profile?.full_name}
                        {m.role === "owner" && (
                          <Crown size={11} className="ml-[5px] inline align-[-1px] text-[#d9a21b]" aria-label="Owner" />
                        )}
                      </strong>
                      <span>{m.profile?.email}</span>
                    </div>
                    <div className={balanceClass(bal)}>{bal === 0 ? "Settled" : formatCents(bal, cur, { sign: true })}</div>
                    {isOwner && m.user_id !== userId ? (
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => kick(m)}
                        aria-label={`Remove ${m.profile?.full_name}`}
                      >
                        <UserMinus size={15} />
                      </button>
                    ) : (
                      <span className={page.spacer} />
                    )}
                  </div>
                );
              })}
            </div>

            <form className="flex gap-2 px-[17px] pt-3.5 max-[430px]:flex-col" onSubmit={invite}>
              <input
                className={cx(form.input, "!h-[42px] !text-[13px]")}
                type="email"
                placeholder="Add by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                aria-label="Member email"
              />
              <button type="submit" className={btn.primary} disabled={inviting || !inviteEmail.trim()}>
                <UserPlus size={15} />
                {inviting ? "Adding…" : "Add"}
              </button>
            </form>

            <div className="mx-[17px] mt-3 mb-4 flex items-center justify-between gap-2.5 rounded-[10px] border border-dashed border-[#d8ddd6] bg-[#f7f8f6] px-[13px] py-[11px]">
              <div>
                <span className="block text-[11px] font-bold text-payo-light">Invite code</span>
                <code className="mt-[3px] block font-mono text-base font-medium tracking-[0.18em] text-payo-ink">
                  {group.invite_code}
                </code>
              </div>
              <button type="button" className={btnSm.ghost} onClick={copyCode}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 max-[760px]:justify-stretch max-[760px]:[&>button]:flex-1">
            <button type="button" className={btnSm.ghost} onClick={leave}>
              <DoorOpen size={14} /> Leave group
            </button>
            {isOwner && (
              <button type="button" className={btnSm.danger} onClick={destroy}>
                <Trash2 size={14} /> Delete group
              </button>
            )}
          </div>
        </div>
      </section>

      <EditGroupModal open={editOpen} onClose={() => setEditOpen(false)} group={group} onSaved={refresh} />

      <SettleModal
        open={settle.open}
        preset={settle.preset}
        onClose={() => setSettle({ open: false, preset: null })}
        group={group}
        members={members}
        userId={userId}
        memberName={memberName}
        onSaved={refresh}
      />
    </>
  );
}
