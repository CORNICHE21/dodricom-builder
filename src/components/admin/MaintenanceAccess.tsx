import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { listAdminUsers, setAdminUserPermissions } from "@/lib/admin-users.functions";

/** Sélection des utilisateurs autorisés à voir le front-office pendant la maintenance. */
export function MaintenanceAccess() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const savePerms = useServerFn(setAdminUserPermissions);

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const toggle = useMutation({
    mutationFn: (input: { userId: string; modules: never[]; maintenanceAccess: boolean }) =>
      savePerms({ data: input as never }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
        Accès au site pendant la maintenance
      </p>
      <p className="mb-3 mt-1 text-xs text-white/45">
        Les super admins voient toujours le site. Cochez les autres utilisateurs autorisés.
      </p>
      {users.isLoading ? (
        <p className="text-xs text-white/40">Chargement…</p>
      ) : users.error ? (
        <p className="text-xs text-rose-200">{(users.error as Error).message}</p>
      ) : (
        <div className="space-y-1.5">
          {(users.data ?? []).map((u) => {
            const isSuper = u.roles.includes("super_admin");
            return (
              <label
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white/75"
              >
                <span className="min-w-0 truncate">
                  {u.displayName} <span className="text-white/35">· {u.email}</span>
                </span>
                {isSuper ? (
                  <span className="shrink-0 text-[11px] text-emerald-300">Super admin</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={u.maintenanceAccess}
                    onChange={(e) =>
                      toggle.mutate({
                        userId: u.id,
                        modules: u.modules as never[],
                        maintenanceAccess: e.target.checked,
                      })
                    }
                    className="h-3.5 w-3.5 shrink-0 accent-[color:var(--brand-violet)]"
                  />
                )}
              </label>
            );
          })}
          {toggle.isPending && (
            <p className="flex items-center gap-2 text-[11px] text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
