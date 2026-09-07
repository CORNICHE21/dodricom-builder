import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, Trash2, UserPlus, XCircle } from "lucide-react";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  setAdminUserPassword,
  setAdminUserRole,
  setAdminUserSuspended,
  setAdminUserPermissions,
  type AdminRole,
  type ModuleKeyDTO,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/administration")({
  component: AdministrationPage,
});

const ROLES: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "commercial", label: "Commercial" },
  { value: "editor", label: "Éditeur" },
];

const MODULES: { key: ModuleKeyDTO; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "administration", label: "Administration" },
  { key: "cms", label: "Website (CMS)" },
  { key: "crm", label: "Commercial (CRM)" },
  { key: "finance", label: "Finance" },
  { key: "billing", label: "Facturation" },
  { key: "saas", label: "SaaS Management" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Paramètres" },
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60";

function since(iso: string | null) {
  if (!iso) return "jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

function AdministrationPage() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", displayName: "", role: "editor" as AdminRole });
  const [permFor, setPermFor] = useState<string | null>(null);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState("");

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const run = <T,>(fn: (input: T) => Promise<unknown>) =>
    useMutationFactory(fn, setError, refresh);

  const create = run(useServerFn(createAdminUser));
  const changeRole = run(useServerFn(setAdminUserRole));
  const changePassword = run(useServerFn(setAdminUserPassword));
  const suspend = run(useServerFn(setAdminUserSuspended));
  const remove = run(useServerFn(deleteAdminUser));
  const savePerms = run(useServerFn(setAdminUserPermissions));

  const list = users.data ?? [];
  const active = list.filter((u) => !u.suspended).length;
  const suspended = list.filter((u) => u.suspended).length;
  const recent = list.filter((u) => Date.now() - new Date(u.createdAt).getTime() < 7 * 864e5).length;

  return (
    <AdminShell title="Administration" breadcrumbs={[{ label: "Administration" }]}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Utilisateurs" value={String(list.length)} icon={ShieldCheck} />
        <StatCard label="Comptes actifs" value={String(active)} icon={CheckCircle2} />
        <StatCard label="Suspendus" value={String(suspended)} icon={XCircle} />
        <StatCard label="Nouveaux (7 j)" value={String(recent)} icon={UserPlus} />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}

      <div className="mt-6 glass p-6">
        <h2 className="text-sm font-semibold text-white">Nouvel utilisateur</h2>
        <p className="mb-4 text-xs text-white/50">
          Le mot de passe est chiffré (haché bcrypt) par le service d'authentification — il n'est jamais stocké en clair.
        </p>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            className={inputCls}
            placeholder="Nom affiché"
            value={form.displayName}
            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="email@dodricom.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            className={inputCls}
            type="password"
            placeholder="Mot de passe (8+)"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <select
            className={inputCls}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AdminRole }))}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setError(null);
              create.mutate(
                { data: form },
                { onSuccess: () => setForm({ email: "", password: "", displayName: "", role: "editor" }) },
              );
            }}
            disabled={create.isPending}
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-60"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Créer
          </button>
        </div>
      </div>

      <div className="mt-6 glass overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Utilisateurs</h2>
          <p className="text-xs text-white/50">Rôles, suspension, réinitialisation de mot de passe.</p>
        </div>
        {users.isLoading ? (
          <p className="px-6 py-8 text-sm text-white/50">Chargement…</p>
        ) : users.error ? (
          <p className="px-6 py-8 text-sm text-rose-200">{(users.error as Error).message}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-white/45">
                  <th className="px-6 py-3">Utilisateur</th>
                  <th className="px-6 py-3">Rôle</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Dernière connexion</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3">
                      <div className="font-medium text-white">{u.displayName}</div>
                      <div className="text-xs text-white/45">{u.email}</div>
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={u.roles[0] ?? "editor"}
                        onChange={(e) => {
                          setError(null);
                          changeRole.mutate({ data: { userId: u.id, role: e.target.value as AdminRole } });
                        }}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          u.suspended ? "bg-rose-400/15 text-rose-200" : "bg-emerald-400/15 text-emerald-200"
                        }`}
                      >
                        {u.suspended ? "Suspendu" : "Actif"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-white/60">{since(u.lastSignInAt)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPermFor(permFor === u.id ? null : u.id)}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:text-white"
                        >
                          Accès
                        </button>
                        <button
                          onClick={() => {
                            setPwFor(pwFor === u.id ? null : u.id);
                            setPwValue("");
                          }}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:text-white"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setError(null);
                            suspend.mutate({ data: { userId: u.id, suspended: !u.suspended } });
                          }}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:text-white"
                        >
                          {u.suspended ? "Réactiver" : "Suspendre"}
                        </button>
                        <button
                          onClick={() => {
                            setError(null);
                            if (confirm(`Supprimer définitivement ${u.email} ?`)) remove.mutate({ data: { userId: u.id } });
                          }}
                          className="rounded-lg border border-rose-400/30 px-2 py-1 text-xs text-rose-200 hover:bg-rose-400/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {permFor === u.id && (
                        <PermissionsPanel
                          modules={u.modules}
                          maintenanceAccess={u.maintenanceAccess}
                          isSuperAdmin={u.roles.includes("super_admin")}
                          onSave={(modules, maintenanceAccess) => {
                            setError(null);
                            savePerms.mutate(
                              { data: { userId: u.id, modules, maintenanceAccess } },
                              { onSuccess: () => setPermFor(null) },
                            );
                          }}
                        />
                      )}
                      {pwFor === u.id && (
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <input
                            type="password"
                            value={pwValue}
                            onChange={(e) => setPwValue(e.target.value)}
                            placeholder="Nouveau mot de passe"
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none"
                          />
                          <button
                            onClick={() => {
                              setError(null);
                              changePassword.mutate(
                                { data: { userId: u.id, password: pwValue } },
                                { onSuccess: () => setPwFor(null) },
                              );
                            }}
                            className="btn-gradient rounded-lg px-3 py-1 text-xs font-semibold"
                          >
                            Enregistrer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function PermissionsPanel({
  modules,
  maintenanceAccess,
  isSuperAdmin,
  onSave,
}: {
  modules: ModuleKeyDTO[];
  maintenanceAccess: boolean;
  isSuperAdmin: boolean;
  onSave: (modules: ModuleKeyDTO[], maintenanceAccess: boolean) => void;
}) {
  const [sel, setSel] = useState<ModuleKeyDTO[]>(modules);
  const [maint, setMaint] = useState(maintenanceAccess);
  const toggle = (k: ModuleKeyDTO) =>
    setSel((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <p className="mb-3 text-xs font-semibold text-white">
        Modules visibles dans le back-office
      </p>
      {isSuperAdmin && (
        <p className="mb-3 text-[11px] text-amber-200/80">
          Un super admin a toujours accès à tous les modules.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        {MODULES.map((m) => (
          <label key={m.key} className="flex items-center gap-2 text-xs text-white/75">
            <input
              type="checkbox"
              checked={sel.includes(m.key)}
              onChange={() => toggle(m.key)}
              className="h-3.5 w-3.5 accent-[color:var(--brand-violet)]"
            />
            {m.label}
          </label>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2 text-xs text-white/75">
        <input
          type="checkbox"
          checked={maint}
          onChange={(e) => setMaint(e.target.checked)}
          className="h-3.5 w-3.5 accent-[color:var(--brand-violet)]"
        />
        Peut consulter le site pendant la maintenance
      </label>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onSave(sel, maint)}
          className="btn-gradient rounded-lg px-4 py-1.5 text-xs font-semibold"
        >
          Enregistrer les accès
        </button>
        <button
          onClick={() => setSel(MODULES.map((m) => m.key))}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white"
        >
          Tout cocher
        </button>
        <button
          onClick={() => setSel([])}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white"
        >
          Tout décocher
        </button>
      </div>
      <p className="mt-2 text-[11px] text-white/40">
        Aucune case cochée = permissions par défaut du rôle.
      </p>
    </div>
  );
}

function useMutationFactory<T>(
  fn: (input: T) => Promise<unknown>,
  setError: (m: string | null) => void,
  refresh: () => Promise<void>,
) {
  return useMutation({
    mutationFn: (input: T) => fn(input),
    onError: (e: Error) => setError(e.message),
    onSuccess: () => void refresh(),
  });
}
