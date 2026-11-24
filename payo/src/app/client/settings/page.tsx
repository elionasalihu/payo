"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, LogOut, Shield, User } from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { PageHeader } from "@/components/dashboard/DashboardParts";
import { InstallAppCard } from "@/components/pwa/PwaUI";
import { badge, btn, cx, form, panel, btnSm } from "@/components/ui/classes";
import { updatePassword, updateProfileName } from "@/lib/supabase/api";
import { initials } from "@/lib/format";

const settingsForm = cx(form.form, "px-[19px] pt-[18px] pb-5");

export default function SettingsPage() {
  const { user, profile, setProfile, signOut, isAdmin } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(profile?.full_name || "");
  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setName(profile?.full_name || "");
  }, [profile?.full_name]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateProfileName(user.id, name.trim());
      setProfile(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (password.length < 8) return setPwError("Password must be at least 8 characters.");
    if (password !== confirm) return setPwError("Passwords don’t match.");
    setSavingPw(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      toast.success("Password changed");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setSavingPw(false);
    }
  };

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="SETTINGS"
        title={
          <>
            Your <strong>account.</strong>
          </>
        }
        description="Manage your profile and sign-in details."
      />

      <div className="!ml-0 grid !max-w-[760px] gap-3.5">
        <section className={panel.panel}>
          <div className="flex items-center gap-4 p-5">
            <span className="flex size-14 flex-[0_0_56px] items-center justify-center rounded-[14px] bg-payo-ink text-lg font-extrabold text-white">
              {initials(profile?.full_name || user?.email)}
            </span>
            <div>
              <strong className="block text-[17px] font-bold tracking-[-0.02em]">{profile?.full_name}</strong>
              <span className="mt-[3px] block text-[13px] text-payo-muted">{user?.email}</span>
              <div className="mt-2.5 flex gap-1.5">
                <span className={badge.green}>
                  {isAdmin ? (
                    <>
                      <Shield size={11} /> Admin
                    </>
                  ) : (
                    "Member"
                  )}
                </span>
                {joined && <span className={badge.muted}>Joined {joined}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className={panel.panel}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>
                <User size={14} /> Profile
              </h2>
              <p className={panel.subtitle}>This is how other members see you</p>
            </div>
          </div>
          <form className={settingsForm} onSubmit={saveName}>
            <label className={form.field}>
              <span className={form.label}>Full name</span>
              <input className={form.input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={form.field}>
              <span className={form.label}>Email</span>
              <input className={form.input} value={user?.email || ""} disabled />
            </label>
            <div>
              <button
                type="submit"
                className={btn.primary}
                disabled={savingName || name.trim() === profile?.full_name}
              >
                {savingName ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <section className={panel.panel}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>
                <KeyRound size={14} /> Password
              </h2>
              <p className={panel.subtitle}>Use at least 8 characters</p>
            </div>
          </div>
          <form className={settingsForm} onSubmit={savePassword} noValidate>
            {pwError && (
              <div className={form.error} role="alert">
                {pwError}
              </div>
            )}
            <div className={form.row}>
              <label className={form.field}>
                <span className={form.label}>New password</span>
                <input
                  className={form.input}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className={form.field}>
                <span className={form.label}>Confirm</span>
                <input
                  className={form.input}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            </div>
            <div>
              <button type="submit" className={btn.primary} disabled={savingPw || !password}>
                {savingPw ? "Saving…" : "Change password"}
              </button>
            </div>
          </form>
        </section>

        <InstallAppCard />

        <section className={panel.panel}>
          <div className={panel.header}>
            <div>
              <h2 className={panel.title}>
                <LogOut size={14} /> Sign out
              </h2>
              <p className={panel.subtitle}>Sign out of Payo on this device</p>
            </div>
            <button type="button" className={btnSm.danger} onClick={signOut}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
