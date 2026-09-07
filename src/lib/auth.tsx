import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export type Role = "super_admin" | "admin" | "commercial" | "editor";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role | null;
  /** All roles granted to this user (super_admin usually implies admin capabilities via ROLE_PERMISSIONS). */
  roles: Role[];
  /** Convenience initials for avatars ("DR"). */
  username: string;
  /** Modules explicitement autorisés (null = permissions par rôle). */
  modules: ModuleKey[] | null;
  /** Peut consulter le front-office pendant la maintenance. */
  maintenanceAccess: boolean;
}

export type ModuleKey =
  | "dashboard"
  | "administration"
  | "cms"
  | "crm"
  | "finance"
  | "billing"
  | "saas"
  | "messages"
  | "settings";

export const ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  super_admin: [
    "dashboard",
    "administration",
    "cms",
    "crm",
    "finance",
    "billing",
    "saas",
    "messages",
    "settings",
  ],
  admin: [
    "dashboard",
    "administration",
    "cms",
    "crm",
    "billing",
    "saas",
    "messages",
    "settings",
  ],
  commercial: ["dashboard", "cms", "crm", "billing", "messages"],
  editor: ["dashboard", "cms", "messages"],
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  can: (module: ModuleKey) => boolean;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFor(displayName: string, email: string) {
  const source = displayName || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function hydrateUser(userId: string, email: string): Promise<AuthUser | null> {
  const [profileRes, rolesRes, permRes] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, email").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("user_permissions").select("modules, maintenance_access").eq("user_id", userId).maybeSingle(),
  ]);
  const profile = profileRes.data;
  const roles = (rolesRes.data ?? []).map((r) => r.role as Role);
  const displayName = profile?.display_name || email.split("@")[0];
  // Priority: super_admin > admin > commercial > editor
  const order: Role[] = ["super_admin", "admin", "commercial", "editor"];
  const primary = order.find((r) => roles.includes(r)) ?? null;
  return {
    id: userId,
    email: profile?.email || email,
    displayName,
    avatarUrl: profile?.avatar_url ?? null,
    role: primary,
    roles,
    username: initialsFor(displayName, email),
    modules: Array.isArray(permRes.data?.modules) && (permRes.data?.modules as ModuleKey[]).length
      ? (permRes.data?.modules as ModuleKey[])
      : null,
    maintenanceAccess: Boolean(permRes.data?.maintenance_access),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1) Register listener first (recommended pattern)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      // Defer hydration to avoid blocking the auth callback
      setTimeout(() => {
        if (!mounted) return;
        hydrateUser(session.user.id, session.user.email ?? "").then((u) => {
          if (mounted) setUser(u);
        });
      }, 0);
    });

    // 2) Then check for an existing session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      if (!session?.user) {
        setReady(true);
        return;
      }
      hydrateUser(session.user.id, session.user.email ?? "").then((u) => {
        if (!mounted) return;
        setUser(u);
        setReady(true);
      });
    });

    // Failsafe: mark ready even if network is slow
    const t = setTimeout(() => mounted && setReady(true), 1500);

    return () => {
      mounted = false;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const loginWithPassword: AuthContextValue["loginWithPassword"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signUpWithPassword: AuthContextValue["signUpWithPassword"] = async (
    email,
    password,
    displayName,
  ) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
        data: { display_name: displayName },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const loginWithGoogle: AuthContextValue["loginWithGoogle"] = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const can: AuthContextValue["can"] = (m) => {
    if (!user) return false;
    if (user.roles.includes("super_admin")) return true;
    if (user.modules) return user.modules.includes(m);
    return user.roles.some((r) => ROLE_PERMISSIONS[r]?.includes(m));
  };

  const hasRole = (r: Role) => !!user?.roles.includes(r);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        loginWithPassword,
        signUpWithPassword,
        loginWithGoogle,
        logout,
        can,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}