"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import AuthLayout, { FormError, auth, friendlyAuthError } from "@/components/auth/AuthLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { updatePassword } from "@/lib/supabase/api";

// Opened from the password reset e-mail. Supabase signs the user in from the link
// (detectSessionInUrl), then the new password is saved with auth.updateUser.
export default function ResetPasswordPage() {
  const { user, loading, setRecovering } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don’t match.");
    setError("");
    setSubmitting(true);
    try {
      await updatePassword(password);
      setRecovering(false);
      router.replace("/client");
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  const linkInvalid = !loading && !user;

  return (
    <AuthLayout
      eyebrow="NEW PASSWORD"
      title={
        <>
          Choose a new <em>password.</em>
        </>
      }
      footer={<Link href="/login">Back to log in</Link>}
    >
      {linkInvalid ? (
        <FormError message="This reset link is invalid or has expired. Request a new one from the login page." />
      ) : (
        <form className={auth.form} onSubmit={handleSubmit} noValidate>
          <FormError message={error} />
          <label className={auth.field}>
            <span className={auth.fieldLabel}>New password</span>
            <input
              className={auth.input}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className={auth.field}>
            <span className={auth.fieldLabel}>Confirm new password</span>
            <input
              className={auth.input}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button type="submit" className={auth.submit} disabled={submitting || loading}>
            {submitting ? "Saving…" : "Save password"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
