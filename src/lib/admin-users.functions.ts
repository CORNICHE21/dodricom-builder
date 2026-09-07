import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRole = "super_admin" | "admin" | "commercial" | "editor";

export type ModuleKeyDTO =
  | "dashboard"
  | "administration"
  | "cms"
  | "crm"
  | "finance"
  | "billing"
  | "saas"
  | "messages"
  | "settings";

export type AdminUserDTO = {
  id: string;
  email: string;
  displayName: string;
  roles: AdminRole[];
  suspended: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  confirmed: boolean;
  modules: ModuleKeyDTO[];
  maintenanceAccess: boolean;
};

type Ctx = { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const [admin, superAdmin] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  const isSuper = Boolean(superAdmin.data);
  if (!admin.data && !isSuper) throw new Error("Accès refusé : réservé aux administrateurs.");
  return isSuper;
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserDTO[]> => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);

    const [{ data: profiles }, { data: roles }, { data: perms }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, email"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("user_permissions").select("user_id, modules, maintenance_access"),
    ]);
    const permById = new Map(
      (perms ?? []).map((p) => [
        p.user_id,
        {
          modules: (Array.isArray(p.modules) ? (p.modules as ModuleKeyDTO[]) : []),
          maintenanceAccess: Boolean(p.maintenance_access),
        },
      ]),
    );

    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? ""]));
    const rolesById = new Map<string, AdminRole[]>();
    for (const r of roles ?? []) {
      const arr = rolesById.get(r.user_id) ?? [];
      arr.push(r.role as AdminRole);
      rolesById.set(r.user_id, arr);
    }

    return list.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      displayName: nameById.get(u.id) || (u.user_metadata?.["display_name"] as string) || (u.email ?? "").split("@")[0]!,
      roles: rolesById.get(u.id) ?? [],
      suspended: Boolean((u as { banned_until?: string | null }).banned_until),
      lastSignInAt: u.last_sign_in_at ?? null,
      createdAt: u.created_at,
      confirmed: Boolean(u.email_confirmed_at),
      modules: permById.get(u.id)?.modules ?? [],
      maintenanceAccess: permById.get(u.id)?.maintenanceAccess ?? false,
    }));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; password: string; displayName: string; role: AdminRole }) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error("Email invalide.");
    if (data.password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const isSuper = await assertAdmin(context as unknown as Ctx);
    if (data.role === "super_admin" && !isSuper) throw new Error("Seul un super admin peut créer un super admin.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Le mot de passe est haché (bcrypt) par le service d'authentification : jamais stocké en clair.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (error) throw new Error(error.message);

    const uid = created.user!.id;
    await supabaseAdmin.from("profiles").upsert(
      { id: uid, email: data.email.trim(), display_name: data.displayName },
      { onConflict: "id" },
    );
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    if (rErr) throw new Error(rErr.message);
    return { ok: true as const, id: uid };
  });

export const setAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; role: AdminRole }) => data)
  .handler(async ({ data, context }) => {
    const isSuper = await assertAdmin(context as unknown as Ctx);
    if (data.role === "super_admin" && !isSuper) throw new Error("Seul un super admin peut nommer un super admin.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    const { data: current } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    const wasSuper = (current ?? []).some((r) => r.role === "super_admin");
    if (wasSuper && data.role !== "super_admin" && (count ?? 0) <= 1)
      throw new Error("Impossible : il doit rester au moins un super admin.");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAdminUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; password: string }) => {
    if (data.password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Hachage bcrypt côté service d'authentification.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAdminUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; suspended: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    if (data.userId === (context as unknown as Ctx).userId) throw new Error("Vous ne pouvez pas vous suspendre vous-même.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? "876000h" : "none",
    } as { ban_duration: string });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    const isSuper = await assertAdmin(context as unknown as Ctx);
    if (!isSuper) throw new Error("Seul un super admin peut supprimer un utilisateur.");
    if (data.userId === (context as unknown as Ctx).userId) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAdminUserPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; modules: ModuleKeyDTO[]; maintenanceAccess: boolean }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_permissions").upsert(
      {
        user_id: data.userId,
        modules: data.modules,
        maintenance_access: data.maintenanceAccess,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
