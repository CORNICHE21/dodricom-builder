/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { btnCls, btnPrimary, Modal } from "@/components/admin/finance/ui";
import { useSyncLinks, type Row } from "@/lib/saas-data";

export type LinkGroup = { label: string; items: { id: string; label: string }[] };

/** Sélection multiple sauvegardée dans une table de liaison. */
export function LinksModal({
  title,
  groups,
  selected,
  table,
  ownerKey,
  ownerId,
  targetKey,
  onClose,
}: {
  title: string;
  groups: LinkGroup[];
  selected: string[];
  table: string;
  ownerKey: string;
  ownerId: string;
  targetKey: string;
  onClose: () => void;
}) {
  const [ids, setIds] = useState<string[]>(selected);
  const sync = useSyncLinks();

  function toggle(id: string) {
    setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit() {
    try {
      await sync.mutateAsync({ table, ownerKey, ownerId, targetKey, ids });
      toast.success("Sélection enregistrée");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Enregistrement impossible");
    }
  }

  return (
    <Modal
      title={title}
      wide
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btnCls}>
            Annuler
          </button>
          <button onClick={submit} disabled={sync.isPending} className={btnPrimary}>
            Enregistrer
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
              {g.label}
            </p>
            <div className="space-y-1.5">
              {g.items.map((it) => (
                <label
                  key={it.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-white/75"
                >
                  <input
                    type="checkbox"
                    checked={ids.includes(it.id)}
                    onChange={() => toggle(it.id)}
                    className="h-3.5 w-3.5 accent-[color:var(--brand-violet)]"
                  />
                  {it.label}
                </label>
              ))}
              {g.items.length === 0 && <p className="text-xs text-white/30">Aucun élément</p>}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function serviceGroups(apps: Row[], services: Row[]): LinkGroup[] {
  return apps.map((a) => ({
    label: (a["name"] as string) ?? "",
    items: services
      .filter((s) => s["app_id"] === a["id"])
      .map((s) => ({
        id: s["id"] as string,
        label: s["parent_id"] ? `— ${s["name"]}` : (s["name"] as string),
      })),
  }));
}
