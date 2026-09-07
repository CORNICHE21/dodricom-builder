import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, Field, Modal, Panel, Td, btnCls, btnPrimary, fmt, inputCls } from "./ui";
import type { Scope } from "./scope";
import { useDeleteRow, useSaveRow } from "@/lib/finance-data";
import type { Supplier } from "@/lib/finance";

const empty = (): Partial<Supplier> => ({ name: "", is_active: true });

export function FinanceSuppliers({ scope, canEdit }: { scope: Scope; canEdit: boolean }) {
  const { data } = scope;
  const currency = data.settings?.currency ?? "MAD";
  const save = useSaveRow();
  const del = useDeleteRow();
  const [form, setForm] = useState<Partial<Supplier> | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const stats = (id: string) => {
    const invoices = data.supplierInvoices.filter((i) => i.supplier_id === id);
    const total = invoices.reduce((s, i) => s + Number(i.total_ttc || 0), 0);
    const paid = data.transactions
      .filter((t) => t.supplier_id === id && t.tx_type === "decaissement")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const overdue = invoices.filter(
      (i) => i.due_date && i.due_date < today && i.status !== "paye" && i.status !== "annule",
    ).length;
    return { invoices, total, paid, remaining: Math.max(0, total - paid), overdue };
  };

  async function submit() {
    if (!form?.name) {
      toast.error("Nom obligatoire");
      return;
    }
    await save.mutateAsync({ table: "suppliers", row: form as Record<string, unknown> });
    toast.success("Fournisseur enregistré");
    setForm(null);
  }

  const current = data.suppliers.find((s) => s.id === open) ?? null;

  return (
    <div className="space-y-6">
      <Panel
        title="Fournisseurs"
        actions={
          canEdit && (
            <button className={btnPrimary} onClick={() => setForm(empty())}>
              <Plus className="h-4 w-4" /> Nouveau fournisseur
            </button>
          )
        }
      >
        <DataTable
          head={["Nom", "ICE", "Ville", "Téléphone", "Total achats", "Payé", "Reste", "Échues", ""]}
          empty={data.suppliers.length === 0}
        >
          {data.suppliers.map((s) => {
            const st = stats(s.id);
            return (
              <tr key={s.id}>
                <Td>{s.name}</Td>
                <Td>{s.ice ?? "—"}</Td>
                <Td>{s.city ?? "—"}</Td>
                <Td>{s.phone ?? "—"}</Td>
                <Td>{fmt(st.total, currency)}</Td>
                <Td>{fmt(st.paid, currency)}</Td>
                <Td className={st.remaining > 0 ? "text-rose-200" : ""}>{fmt(st.remaining, currency)}</Td>
                <Td>{st.overdue || "—"}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button className={btnCls} onClick={() => setOpen(s.id === open ? null : s.id)}>
                      Fiche
                    </button>
                    {canEdit && (
                      <>
                        <button className={btnCls} onClick={() => setForm(s)}>
                          Modifier
                        </button>
                        <button
                          className={btnCls}
                          onClick={() =>
                            del.mutate(
                              { table: "suppliers", id: s.id },
                              { onSuccess: () => toast.success("Supprimé") },
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>

      {current && (
        <Panel title={`Fiche fournisseur — ${current.name}`}>
          <div className="grid gap-2 text-sm text-white/70 sm:grid-cols-3">
            <p>ICE : {current.ice ?? "—"}</p>
            <p>IF : {current.if_number ?? "—"}</p>
            <p>RC : {current.rc ?? "—"}</p>
            <p>Adresse : {current.address ?? "—"}</p>
            <p>Email : {current.email ?? "—"}</p>
            <p>RIB : {current.rib ?? "—"}</p>
            <p>Conditions : {current.payment_terms ?? "—"}</p>
          </div>
          <h4 className="mt-6 mb-2 text-sm font-semibold text-white">Historique des transactions</h4>
          <DataTable
            head={["Date", "Référence", "Libellé", "Montant", "Mode"]}
            empty={data.transactions.filter((t) => t.supplier_id === current.id).length === 0}
          >
            {data.transactions
              .filter((t) => t.supplier_id === current.id)
              .map((t) => (
                <tr key={t.id}>
                  <Td>{t.tx_date}</Td>
                  <Td>{t.reference ?? "—"}</Td>
                  <Td>{t.label}</Td>
                  <Td>{fmt(t.amount, currency)}</Td>
                  <Td>{t.payment_method}</Td>
                </tr>
              ))}
          </DataTable>
        </Panel>
      )}

      {form && (
        <Modal
          title="Fournisseur"
          onClose={() => setForm(null)}
          wide
          footer={
            <>
              <button className={btnCls} onClick={() => setForm(null)}>
                Annuler
              </button>
              <button className={btnPrimary} onClick={submit}>
                Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["name", "Nom"],
                ["ice", "ICE"],
                ["if_number", "IF"],
                ["rc", "RC"],
                ["address", "Adresse"],
                ["city", "Ville"],
                ["phone", "Téléphone"],
                ["email", "Email"],
                ["rib", "RIB"],
                ["payment_terms", "Conditions de paiement"],
              ] as [keyof Supplier, string][]
            ).map(([key, label]) => (
              <Field key={String(key)} label={label}>
                <input
                  className={inputCls}
                  value={String(form[key] ?? "")}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="Notes" className="sm:col-span-2">
              <input
                className={inputCls}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
