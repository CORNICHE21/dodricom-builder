import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  DataTable,
  Field,
  Kpi,
  Modal,
  Panel,
  Td,
  btnCls,
  btnPrimary,
  fmt,
  inputCls,
} from "./ui";
import type { Scope, Selectors } from "./scope";
import { useDeleteRow, useSaveRow, exportCsv } from "@/lib/finance-data";
import {
  SUPPLIER_DOC_TYPES,
  SUPPLIER_STATUSES,
  todayIso,
  type SupplierInvoice,
} from "@/lib/finance";

const empty = (vat: number): Partial<SupplierInvoice> => ({
  doc_type: "facture_fournisseur",
  reference: "",
  issue_date: todayIso(),
  due_date: null,
  description: "",
  total_ht: 0,
  vat_rate: vat,
  total_vat: 0,
  total_ttc: 0,
  status: "valide",
  supplier_id: null,
  pos_id: null,
  notes: "",
});

export function FinancePurchases({
  scope,
  sel,
  canEdit,
  canExport,
}: {
  scope: Scope;
  sel: Selectors;
  canEdit: boolean;
  canExport: boolean;
}) {
  const { data } = scope;
  const currency = data.settings?.currency ?? "MAD";
  const save = useSaveRow();
  const del = useDeleteRow();
  const [form, setForm] = useState<Partial<SupplierInvoice> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      sel.supplierInvoices.filter(
        (i) =>
          (status === "all" || i.status === status) &&
          `${i.reference} ${data.suppliers.find((s) => s.id === i.supplier_id)?.name ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [sel.supplierInvoices, search, status, data.suppliers],
  );

  const paidOf = (invoiceId: string) =>
    data.transactions
      .filter((t) => t.supplier_invoice_id === invoiceId && t.tx_type === "decaissement")
      .reduce((s, t) => s + Number(t.amount || 0), 0);

  function setTotals(patch: Partial<SupplierInvoice>) {
    const next = { ...(form ?? {}), ...patch } as Partial<SupplierInvoice>;
    const ht = Number(next.total_ht || 0);
    const rate = Number(next.vat_rate || 0);
    next.total_vat = Math.round(ht * rate) / 100;
    next.total_ttc = Math.round((ht + (ht * rate) / 100) * 100) / 100;
    setForm(next);
  }

  async function submit() {
    if (!form?.reference) {
      toast.error("Référence obligatoire");
      return;
    }
    await save.mutateAsync({ table: "supplier_invoices", row: form as Record<string, unknown> });
    toast.success("Document fournisseur enregistré");
    setForm(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Achats HT (période)" value={fmt(sel.purchasesHt, currency)} />
        <Kpi
          label="Achats TTC (période)"
          value={fmt(sel.supplierInvoices.reduce((s, i) => s + Number(i.total_ttc || 0), 0), currency)}
        />
        <Kpi label="Dettes fournisseurs" value={fmt(sel.supplierDebt, currency)} tone="bad" />
        <Kpi
          label="Documents"
          value={String(sel.supplierInvoices.length)}
          hint="sur la période sélectionnée"
        />
      </div>

      <Panel
        title="Achats & factures fournisseurs"
        actions={
          <>
            <input
              placeholder="Référence ou fournisseur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} h-9 w-52 py-1.5`}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputCls} h-9 w-40 py-1.5`}
            >
              <option value="all">Tous les statuts</option>
              {SUPPLIER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {canExport && (
              <button
                className={btnCls}
                onClick={() =>
                  exportCsv("achats.csv", [
                    ["Référence", "Type", "Date", "Fournisseur", "HT", "TVA", "TTC", "Payé", "Reste", "Échéance", "Statut"],
                    ...rows.map((i) => [
                      i.reference,
                      i.doc_type,
                      i.issue_date,
                      data.suppliers.find((s) => s.id === i.supplier_id)?.name ?? "",
                      i.total_ht,
                      i.total_vat,
                      i.total_ttc,
                      paidOf(i.id),
                      Number(i.total_ttc) - paidOf(i.id),
                      i.due_date ?? "",
                      i.status,
                    ]),
                  ])
                }
              >
                Export CSV
              </button>
            )}
            {canEdit && (
              <button className={btnPrimary} onClick={() => setForm(empty(data.settings?.default_vat ?? 20))}>
                <Plus className="h-4 w-4" /> Nouveau document
              </button>
            )}
          </>
        }
      >
        <DataTable
          head={["Référence", "Date", "Fournisseur", "HT", "TVA", "TTC", "Payé", "Reste", "Échéance", "Statut", ""]}
          empty={rows.length === 0}
        >
          {rows.map((i) => {
            const paid = paidOf(i.id);
            const meta = SUPPLIER_STATUSES.find((s) => s.value === i.status);
            return (
              <tr key={i.id}>
                <Td>{i.reference}</Td>
                <Td>{i.issue_date}</Td>
                <Td>{data.suppliers.find((s) => s.id === i.supplier_id)?.name ?? "—"}</Td>
                <Td>{fmt(i.total_ht, currency)}</Td>
                <Td>{fmt(i.total_vat, currency)}</Td>
                <Td>{fmt(i.total_ttc, currency)}</Td>
                <Td>{fmt(paid, currency)}</Td>
                <Td>{fmt(Math.max(0, Number(i.total_ttc) - paid), currency)}</Td>
                <Td>{i.due_date ?? "—"}</Td>
                <Td>
                  <Badge label={meta?.label ?? i.status} cls={meta?.cls ?? "bg-white/10 text-white/70"} />
                </Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button className={btnCls} onClick={() => setForm(i)}>
                        Modifier
                      </button>
                      <button
                        className={btnCls}
                        onClick={() =>
                          del.mutate(
                            { table: "supplier_invoices", id: i.id },
                            { onSuccess: () => toast.success("Supprimé") },
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>

      {form && (
        <Modal
          title="Document fournisseur"
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
            <Field label="Type">
              <select
                className={inputCls}
                value={form.doc_type ?? ""}
                onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
              >
                {SUPPLIER_DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Référence">
              <input
                className={inputCls}
                value={form.reference ?? ""}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </Field>
            <Field label="Fournisseur">
              <select
                className={inputCls}
                value={form.supplier_id ?? ""}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value || null })}
              >
                <option value="">—</option>
                {data.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Point de vente">
              <select
                className={inputCls}
                value={form.pos_id ?? ""}
                onChange={(e) => setForm({ ...form, pos_id: e.target.value || null })}
              >
                <option value="">—</option>
                {data.pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={form.issue_date ?? ""}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </Field>
            <Field label="Échéance">
              <input
                type="date"
                className={inputCls}
                value={form.due_date ?? ""}
                onChange={(e) => setForm({ ...form, due_date: e.target.value || null })}
              />
            </Field>
            <Field label="Montant HT">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={form.total_ht ?? 0}
                onChange={(e) => setTotals({ total_ht: Number(e.target.value) })}
              />
            </Field>
            <Field label="Taux TVA (%)">
              <select
                className={inputCls}
                value={String(form.vat_rate ?? 20)}
                onChange={(e) => setTotals({ vat_rate: Number(e.target.value) })}
              >
                {data.taxRates.map((t) => (
                  <option key={t.id} value={String(t.rate)}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="TVA">
              <input className={inputCls} value={fmt(Number(form.total_vat ?? 0), currency)} readOnly />
            </Field>
            <Field label="Total TTC">
              <input className={inputCls} value={fmt(Number(form.total_ttc ?? 0), currency)} readOnly />
            </Field>
            <Field label="Statut">
              <select
                className={inputCls}
                value={form.status ?? "valide"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {SUPPLIER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <input
                className={inputCls}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
