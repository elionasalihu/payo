"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { AuthResponse, Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { fetchProfile } from "@/lib/supabase/api";
import type { Profile } from "@/lib/types";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  recovering: boolean;
  setRecovering: Dispatch<SetStateAction<boolean>>;
  /** UI only. The database enforces admin rights with is_admin() in RLS policies. */
  isAdmin: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse["data"]>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<AuthResponse["data"]>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  setProfile: Dispatch<SetStateAction<Profile | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [recovering, setRecovering] = useState(false);

  const user = session?.user ?? null;

  // Session bootstrap + listener
  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    // If Supabase can't refresh an old token (bad network, paused project)
    // it keeps retrying for ~30s. Don't block the whole app on that.
    const giveUp = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (!data.session) setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(giveUp);
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;
    // If the profile can't be loaded, fall back to a normal "user" role.
    const fallback: Profile = {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      role: "user",
    };
    try {
      const data = await fetchProfile(user.id);
      setProfile(data || fallback);
      return data;
    } catch (error) {
      console.error("Could not load profile:", (error as Error).message);
      setProfile(fallback);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load profile whenever the signed-in user changes
  const userId = user?.id;
  useEffect(() => {
    if (userId) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(
    async ({ fullName, email, password }: { fullName: string; email: string; password: string }) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Only the name is sent. The role is always 'user' (set by the database trigger).
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/client`,
        },
      });
      if (error) throw error;
      return data;
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      recovering,
      setRecovering,
      isAdmin: profile?.role === "admin",
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      refreshProfile: loadProfile,
      setProfile,
    }),
    [session, user, profile, loading, recovering, signIn, signUp, signOut, sendPasswordReset, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
