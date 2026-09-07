import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
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
import { FIN_PAYMENT_METHODS, num, todayIso, type Expense } from "@/lib/finance";

const emptyExpense = (vat: number): Partial<Expense> => ({
  expense_date: todayIso(),
  category_id: null,
  supplier_id: null,
  description: "",
  amount_ht: 0,
  vat_rate: vat,
  vat_amount: 0,
  amount_ttc: 0,
  account_id: null,
  payment_method: "virement",
  pos_id: null,
  receipt_url: "",
  notes: "",
});

export function FinanceExpenses({
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
  const [form, setForm] = useState<Partial<Expense> | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const catName = (id: string | null | undefined) =>
    data.expenseCategories.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(
    () =>
      sel.expenses.filter(
        (e) =>
          (cat === "all" || e.category_id === cat) &&
          `${e.description} ${catName(e.category_id)}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [sel.expenses, search, cat],
  );

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of rows) {
      const k = catName(e.category_id);
      m.set(k, (m.get(k) ?? 0) + num(e.amount_ttc));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  function setAmount(patch: Partial<Expense>) {
    setForm((f) => {
      const next = { ...(f ?? {}), ...patch };
      const ht = num(next.amount_ht);
      const rate = num(next.vat_rate);
      const vat = Math.round(ht * rate) / 100;
      return { ...next, vat_amount: vat, amount_ttc: Math.round((ht + vat) * 100) / 100 };
    });
  }

  async function submit() {
    if (!form?.description?.trim()) return toast.error("Description requise");
    try {
      await save.mutateAsync({ table: "expenses", row: form as Record<string, unknown> });
      toast.success("Dépense enregistrée");
      setForm(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Dépenses HT" value={fmt(sel.expenseHt, currency)} />
        <Kpi label="Dépenses TTC" value={fmt(sel.expenseTtc, currency)} tone="bad" />
        <Kpi label="Nombre" value={String(rows.length)} />
        <Kpi label="Catégories actives" value={String(byCat.length)} />
      </div>

      <Panel
        title="Dépenses"
        actions={
          <>
            <input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} h-9 w-44 py-1.5`}
            />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className={`${inputCls} h-9 w-44 py-1.5`}
            >
              <option value="all">Toutes catégories</option>
              {data.expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {canExport && (
              <button
                className={btnCls}
                onClick={() =>
                  exportCsv("depenses.csv", [
                    ["Date", "Catégorie", "Description", "HT", "TVA", "TTC", "Mode", "Point de vente"],
                    ...rows.map((e) => [
                      e.expense_date,
                      catName(e.category_id),
                      e.description,
                      e.amount_ht,
                      e.vat_amount,
                      e.amount_ttc,
                      e.payment_method,
                      data.pos.find((p) => p.id === e.pos_id)?.name ?? "",
                    ]),
                  ])
                }
              >
                Export CSV
              </button>
            )}
            {canEdit && (
              <button
                className={btnPrimary}
                onClick={() => setForm(emptyExpense(num(data.settings?.default_vat) || 20))}
              >
                <Plus className="h-4 w-4" /> Dépense
              </button>
            )}
          </>
        }
      >
        <DataTable
          head={["Date", "Catégorie", "Description", "HT", "TVA", "TTC", "Mode", "PDV", ""]}
          empty={rows.length === 0}
        >
          {rows.map((e) => (
            <tr key={e.id}>
              <Td>{e.expense_date}</Td>
              <Td>{catName(e.category_id)}</Td>
              <Td className="max-w-[260px] truncate">{e.description}</Td>
              <Td>{fmt(e.amount_ht, currency)}</Td>
              <Td>{fmt(e.vat_amount, currency)}</Td>
              <Td>{fmt(e.amount_ttc, currency)}</Td>
              <Td>{e.payment_method}</Td>
              <Td>{data.pos.find((p) => p.id === e.pos_id)?.name ?? "—"}</Td>
              <Td>
                {canEdit && (
                  <div className="flex gap-2">
                    <button className={btnCls} onClick={() => setForm(e)}>
                      Éditer
                    </button>
                    <button
                      className={btnCls}
                      onClick={() => del.mutate({ table: "expenses", id: e.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {byCat.length > 0 && (
        <Panel title="Répartition par catégorie">
          <div className="space-y-2">
            {byCat.map(([name, total]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{name}</span>
                <span className="font-semibold text-white">{fmt(total, currency)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {form && (
        <Modal
          title={form.id ? "Modifier la dépense" : "Nouvelle dépense"}
          onClose={() => setForm(null)}
          wide
          footer={
            <>
              <button className={btnCls} onClick={() => setForm(null)}>
                Annuler
              </button>
              <button className={btnPrimary} onClick={submit} disabled={save.isPending}>
                Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={form.expense_date ?? ""}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              />
            </Field>
            <Field label="Catégorie">
              <select
                className={inputCls}
                value={form.category_id ?? ""}
                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
              >
                <option value="">—</option>
                {data.expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
            <Field label="Description" className="sm:col-span-2">
              <input
                className={inputCls}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Montant HT">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={form.amount_ht ?? 0}
                onChange={(e) => setAmount({ amount_ht: Number(e.target.value) })}
              />
            </Field>
            <Field label="Taux TVA (%)">
              <select
                className={inputCls}
                value={String(form.vat_rate ?? 20)}
                onChange={(e) => setAmount({ vat_rate: Number(e.target.value) })}
              >
                {data.taxRates.map((t) => (
                  <option key={t.id} value={String(t.rate)}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="TVA">
              <input className={inputCls} value={fmt(num(form.vat_amount), currency)} readOnly />
            </Field>
            <Field label="TTC">
              <input className={inputCls} value={fmt(num(form.amount_ttc), currency)} readOnly />
            </Field>
            <Field label="Compte">
              <select
                className={inputCls}
                value={form.account_id ?? ""}
                onChange={(e) => setForm({ ...form, account_id: e.target.value || null })}
              >
                <option value="">—</option>
                {data.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mode de paiement">
              <select
                className={inputCls}
                value={form.payment_method ?? "virement"}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              >
                {FIN_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
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
            <Field label="Pièce justificative (URL)">
              <input
                className={inputCls}
                value={form.receipt_url ?? ""}
                onChange={(e) => setForm({ ...form, receipt_url: e.target.value })}
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea
                rows={2}
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
