/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  btnCls,
  btnPrimary,
  DataTable,
  Field,
  inputCls,
  Modal,
  Panel,
  Td,
} from "@/components/admin/finance/ui";
import { useDeleteRow, useSaveRow, type Row } from "@/lib/saas-data";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "bool" | "date" | "email";
  options?: { value: string; label: string }[];
  required?: boolean;
  fallback?: any;
  wide?: boolean;
};

export type ColDef = {
  label: string;
  render: (r: Row) => ReactNode;
};

export function EntityCrud({
  table,
  title,
  singular,
  rows,
  columns,
  fields,
  canEdit,
  searchKeys = ["name"],
  extraActions,
  description,
}: {
  table: string;
  title: string;
  singular: string;
  rows: Row[];
  columns: ColDef[];
  fields: FieldDef[];
  canEdit: boolean;
  searchKeys?: string[];
  extraActions?: (r: Row) => ReactNode;
  description?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const save = useSaveRow();
  const del = useDeleteRow();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(s)),
    );
  }, [rows, q, searchKeys]);

  function openNew() {
    const init: Row = {};
    for (const f of fields) init[f.name] = f.fallback ?? (f.type === "bool" ? true : "");
    setForm(init);
    setCurrent(null);
    setOpen(true);
  }

  function openEdit(r: Row) {
    const init: Row = {};
    for (const f of fields) init[f.name] = r[f.name] ?? (f.type === "bool" ? false : "");
    setForm(init);
    setCurrent(r);
    setOpen(true);
  }

  async function submit() {
    const values: Row = {};
    for (const f of fields) {
      const v = form[f.name];
      if (f.required && (v === "" || v === null || v === undefined)) {
        toast.error(`Champ requis : ${f.label}`);
        return;
      }
      if (f.type === "number") values[f.name] = v === "" ? 0 : Number(v);
      else if (f.type === "bool") values[f.name] = !!v;
      else values[f.name] = v === "" ? null : v;
    }
    try {
      await save.mutateAsync({ table, values, id: current?.["id"] ?? null });
      toast.success(current ? "Modifications enregistrées" : `${singular} créé`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Enregistrement impossible");
    }
  }

  async function remove(r: Row) {
    if (!confirm(`Supprimer « ${r["name"] ?? r["full_name"] ?? r["number"] ?? singular} » ?`)) return;
    try {
      await del.mutateAsync({ table, id: r["id"] as string });
      toast.success("Supprimé");
    } catch (e: any) {
      toast.error(e?.message ?? "Suppression impossible");
    }
  }

  return (
    <Panel
      title={title}
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className={`${inputCls} h-9 w-56 py-1.5 pl-9 text-xs`}
            />
          </div>
          {canEdit && (
            <button onClick={openNew} className={btnPrimary}>
              <Plus className="h-3.5 w-3.5" /> Nouveau
            </button>
          )}
        </>
      }
    >
      {description && <p className="mb-4 text-xs text-white/50">{description}</p>}
      <DataTable
        head={[...columns.map((c) => c.label), ""]}
        empty={filtered.length === 0}
      >
        {filtered.map((r) => (
          <tr key={r["id"] as string} className="hover:bg-white/[0.02]">
            {columns.map((c, i) => (
              <Td key={i}>{c.render(r)}</Td>
            ))}
            <Td className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {extraActions?.(r)}
                {canEdit && (
                  <>
                    <button
                      onClick={() => openEdit(r)}
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="rounded-lg p-1.5 text-white/50 hover:bg-rose-500/20 hover:text-rose-300"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </DataTable>

      {open && (
        <Modal
          title={current ? `Modifier — ${singular}` : `Nouveau ${singular.toLowerCase()}`}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button onClick={() => setOpen(false)} className={btnCls}>
                Annuler
              </button>
              <button onClick={submit} disabled={save.isPending} className={btnPrimary}>
                Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <Field
                key={f.name}
                label={f.label}
                className={f.wide || f.type === "textarea" ? "sm:col-span-2" : ""}
              >
                {f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={form[f.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={inputCls}
                  />
                ) : f.type === "select" ? (
                  <select
                    value={form[f.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value} className="bg-[#0b0c12]">
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "bool" ? (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, [f.name]: !form[f.name] })}
                    className={`${btnCls} ${form[f.name] ? "border-emerald-400/40 text-emerald-300" : ""}`}
                  >
                    {form[f.name] ? "Activé" : "Désactivé"}
                  </button>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={form[f.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={inputCls}
                  />
                )}
              </Field>
            ))}
          </div>
        </Modal>
      )}
    </Panel>
  );
}

export function StatusChip({ value }: { value: string | null | undefined }) {
  const v = String(value ?? "").toLowerCase();
  const cls =
    v === "active" || v === "paid" || v === "true"
      ? "bg-emerald-500/15 text-emerald-300"
      : v === "trial" || v === "pending" || v === "sent"
        ? "bg-amber-500/15 text-amber-300"
        : v === "expired" || v === "cancelled" || v === "suspended" || v === "overdue"
          ? "bg-rose-500/15 text-rose-300"
          : "bg-white/10 text-white/60";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {value ?? "—"}
    </span>
  );
}

export function BoolChip({ value }: { value: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        value ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"
      }`}
    >
      {value ? "Actif" : "Inactif"}
    </span>
  );
}
