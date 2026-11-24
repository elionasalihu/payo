"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import Modal from "../ui/Modal";
import { btn, cx, form } from "../ui/classes";
import { useToast } from "../providers/ToastProvider";
import { useWorkspace } from "./Workspace";
import { createGroup, joinGroup } from "@/lib/supabase/api";

type Tab = "create" | "join";

export default function GroupModal() {
  const { groupModal, closeGroupModal, refresh } = useWorkspace();
  const toast = useToast();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!groupModal.open) return;
    setTab(groupModal.tab || "create");
    setName("");
    setDescription("");
    setCode("");
    setError("");
  }, [groupModal.open, groupModal.tab]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "create" && !name.trim()) return setError("Give your group a name.");
    if (tab === "join" && code.trim().length < 6) return setError("Enter the 8-character invite code.");

    setSaving(true);
    try {
      const group =
        tab === "create" ? await createGroup(name.trim(), description.trim()) : await joinGroup(code.trim());
      await refresh();
      toast.success(tab === "create" ? `Created “${group.name}”` : `You joined “${group.name}”`);
      closeGroupModal();
      router.push(`/client/groups/${group.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const segBtn = (active: boolean) => cx(form.segmentBtn, active && form.segmentBtnActive);

  return (
    <Modal
      open={groupModal.open}
      onClose={closeGroupModal}
      title={tab === "create" ? "Create a group" : "Join a group"}
      subtitle={
        tab === "create"
          ? "A shared space for a trip, a flat, a team — anything you split."
          : "Ask a member for the group’s invite code."
      }
      footer={
        <>
          <button type="button" className={btn.ghost} onClick={closeGroupModal}>
            Cancel
          </button>
          <button type="submit" form="group-form" className={btn.primary} disabled={saving}>
            {saving ? "Please wait…" : tab === "create" ? "Create group" : "Join group"}
          </button>
        </>
      }
    >
      <form id="group-form" className={form.form} onSubmit={handleSubmit} noValidate>
        <div className={form.segment}>
          <button type="button" className={segBtn(tab === "create")} onClick={() => setTab("create")}>
            Create new
          </button>
          <button type="button" className={segBtn(tab === "join")} onClick={() => setTab("join")}>
            Join with code
          </button>
        </div>

        {error && (
          <div className={form.error} role="alert">
            {error}
          </div>
        )}

        {tab === "create" ? (
          <>
            <label className={form.field}>
              <span className={form.label}>Group name</span>
              <input
                className={form.input}
                placeholder="e.g. Trip to Tirana"
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
                placeholder="What is this group for?"
                maxLength={140}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </>
        ) : (
          <label className={form.field}>
            <span className={form.label}>Invite code</span>
            <input
              className={cx(form.input, form.code)}
              placeholder="A1B2C3D4"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
          </label>
        )}
      </form>
    </Modal>
  );
}
