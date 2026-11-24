"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import AuthLayout, { FormError, auth, friendlyAuthError } from "@/components/auth/AuthLayout";
import { GuestOnly, redirectTarget } from "@/components/auth/RouteGuards";
import { useAuth } from "@/components/providers/AuthProvider";
import { cx } from "@/components/ui/classes";

function Login() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(redirectTarget());
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title={
        <>
          Log in to <em>Payo.</em>
        </>
      }
      subtitle="Pick up where you left off with your groups and balances."
      footer={
        <>
          New to Payo? <Link href="/register">Create an account</Link>
        </>
      }
    >
      <form className={auth.form} onSubmit={handleSubmit} noValidate>
        <FormError message={error} />

        <label className={auth.field}>
          <span className={auth.fieldLabel}>Email</span>
          <input
            className={auth.input}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={auth.field}>
          <span className={cx(auth.fieldLabel, "flex items-baseline justify-between")}>
            Password
            <Link href="/forgot-password" className={auth.inlineLink}>
              Forgot password?
            </Link>
          </span>
          <div className="relative">
            <input
              className={cx(auth.input, "!pr-11")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={auth.passwordToggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button type="submit" className={auth.submit} disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
          {!submitting && <ArrowRight size={16} />}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <GuestOnly>
      <Login />
    </GuestOnly>
  );
}
