import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { DataTable, Field, Panel, Td, btnCls, btnPrimary, inputCls } from "./ui";
import type { Scope } from "./scope";
import { useDeleteRow, useSaveRow } from "@/lib/finance-data";
import type { ExpenseCategory, FinanceSettings, PosLocation, TaxRate } from "@/lib/finance";
import { num } from "@/lib/finance";

type Tab = "general" | "tva" | "categories" | "pos";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "Paramètres généraux" },
  { key: "tva", label: "Taux de TVA" },
  { key: "categories", label: "Catégories de dépenses" },
  { key: "pos", label: "Points de vente" },
];

const DEFAULTS: Omit<FinanceSettings, "id"> = {
  currency: "MAD",
  default_vat: 20,
  account_client: "3421",
  account_supplier: "4411",
  account_sales: "7111",
  account_vat_collected: "4455",
  account_vat_deductible: "3455",
  account_bank: "5141",
  account_cash: "5161",
  account_expense_default: "6111",
  low_cash_threshold: 0,
  low_bank_threshold: 0,
};

export function FinanceSettingsPanel({ scope, canEdit }: { scope: Scope; canEdit: boolean }) {
  const { data } = scope;
  const [tab, setTab] = useState<Tab>("general");
  const save = useSaveRow();
  const del = useDeleteRow();

  const [form, setForm] = useState<Partial<FinanceSettings>>(data.settings ?? DEFAULTS);
  useEffect(() => {
    setForm(data.settings ?? DEFAULTS);
  }, [data.settings]);

  const [rate, setRate] = useState<Partial<TaxRate> | null>(null);
  const [cat, setCat] = useState<Partial<ExpenseCategory> | null>(null);
  const [pos, setPos] = useState<Partial<PosLocation> | null>(null);

  const set = (k: keyof FinanceSettings, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-[var(--gradient-brand)] text-white"
                : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Panel
          title="Paramètres comptables"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() => save.mutate({ table: "finance_settings", row: { ...form } })}
              >
                <Save className="h-4 w-4" /> Enregistrer
              </button>
            )
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Devise">
              <input
                className={inputCls}
                value={form.currency ?? ""}
                disabled={!canEdit}
                onChange={(e) => set("currency", e.target.value)}
              />
            </Field>
            <Field label="TVA par défaut (%)">
              <input
                type="number"
                className={inputCls}
                value={form.default_vat ?? 20}
                disabled={!canEdit}
                onChange={(e) => set("default_vat", num(e.target.value))}
              />
            </Field>
            {(
              [
                ["account_client", "Compte clients"],
                ["account_supplier", "Compte fournisseurs"],
                ["account_sales", "Compte ventes"],
                ["account_vat_collected", "TVA collectée"],
                ["account_vat_deductible", "TVA déductible"],
                ["account_bank", "Compte banque"],
                ["account_cash", "Compte caisse"],
                ["account_expense_default", "Compte charges par défaut"],
              ] as [keyof FinanceSettings, string][]
            ).map(([k, label]) => (
              <Field key={k} label={label}>
                <input
                  className={inputCls}
                  value={String(form[k] ?? "")}
                  disabled={!canEdit}
                  onChange={(e) => set(k, e.target.value)}
                />
              </Field>
            ))}
            <Field label="Seuil d'alerte caisse">
              <input
                type="number"
                className={inputCls}
                value={form.low_cash_threshold ?? 0}
                disabled={!canEdit}
                onChange={(e) => set("low_cash_threshold", num(e.target.value))}
              />
            </Field>
            <Field label="Seuil d'alerte banque">
              <input
                type="number"
                className={inputCls}
                value={form.low_bank_threshold ?? 0}
                disabled={!canEdit}
                onChange={(e) => set("low_bank_threshold", num(e.target.value))}
              />
            </Field>
          </div>
        </Panel>
      )}

      {tab === "tva" && (
        <Panel
          title="Taux de TVA"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() => setRate({ label: "", rate: 20, is_default: false, is_active: true })}
              >
                <Plus className="h-4 w-4" /> Nouveau taux
              </button>
            )
          }
        >
          {rate && (
            <div className="mb-4 grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-4">
              <Field label="Libellé">
                <input
                  className={inputCls}
                  value={rate.label ?? ""}
                  onChange={(e) => setRate({ ...rate, label: e.target.value })}
                />
              </Field>
              <Field label="Taux (%)">
                <input
                  type="number"
                  className={inputCls}
                  value={rate.rate ?? 0}
                  onChange={(e) => setRate({ ...rate, rate: num(e.target.value) })}
                />
              </Field>
              <Field label="Par défaut">
                <select
                  className={inputCls}
                  value={rate.is_default ? "1" : "0"}
                  onChange={(e) => setRate({ ...rate, is_default: e.target.value === "1" })}
                >
                  <option value="0">Non</option>
                  <option value="1">Oui</option>
                </select>
              </Field>
              <div className="flex items-end gap-2">
                <button
                  className={btnPrimary}
                  onClick={() =>
                    save.mutate(
                      { table: "tax_rates", row: { ...rate } },
                      { onSuccess: () => setRate(null) },
                    )
                  }
                >
                  <Save className="h-4 w-4" /> Enregistrer
                </button>
                <button className={btnCls} onClick={() => setRate(null)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
          <DataTable
            head={["Libellé", "Taux", "Par défaut", "Actif", ""]}
            empty={data.taxRates.length === 0}
          >
            {data.taxRates.map((t) => (
              <tr key={t.id}>
                <Td>{t.label}</Td>
                <Td>{t.rate}%</Td>
                <Td>{t.is_default ? "Oui" : "—"}</Td>
                <Td>{t.is_active ? "Oui" : "Non"}</Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className={btnCls} onClick={() => setRate(t)}>
                        Modifier
                      </button>
                      <button
                        className={btnCls}
                        onClick={() => del.mutate({ table: "tax_rates", id: t.id })}
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
      )}

      {tab === "categories" && (
        <Panel
          title="Catégories de dépenses"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() =>
                  setCat({ name: "", accounting_account: "", sort_order: 0, is_active: true })
                }
              >
                <Plus className="h-4 w-4" /> Nouvelle catégorie
              </button>
            )
          }
        >
          {cat && (
            <div className="mb-4 grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-4">
              <Field label="Nom">
                <input
                  className={inputCls}
                  value={cat.name ?? ""}
                  onChange={(e) => setCat({ ...cat, name: e.target.value })}
                />
              </Field>
              <Field label="Compte comptable">
                <input
                  className={inputCls}
                  value={cat.accounting_account ?? ""}
                  onChange={(e) => setCat({ ...cat, accounting_account: e.target.value })}
                />
              </Field>
              <Field label="Ordre">
                <input
                  type="number"
                  className={inputCls}
                  value={cat.sort_order ?? 0}
                  onChange={(e) => setCat({ ...cat, sort_order: num(e.target.value) })}
                />
              </Field>
              <div className="flex items-end gap-2">
                <button
                  className={btnPrimary}
                  onClick={() =>
                    save.mutate(
                      { table: "expense_categories", row: { ...cat } },
                      { onSuccess: () => setCat(null) },
                    )
                  }
                >
                  <Save className="h-4 w-4" /> Enregistrer
                </button>
                <button className={btnCls} onClick={() => setCat(null)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
          <DataTable
            head={["Nom", "Compte", "Ordre", "Actif", ""]}
            empty={data.expenseCategories.length === 0}
          >
            {data.expenseCategories.map((c) => (
              <tr key={c.id}>
                <Td>{c.name}</Td>
                <Td>{c.accounting_account ?? "—"}</Td>
                <Td>{c.sort_order}</Td>
                <Td>{c.is_active ? "Oui" : "Non"}</Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className={btnCls} onClick={() => setCat(c)}>
                        Modifier
                      </button>
                      <button
                        className={btnCls}
                        onClick={() => del.mutate({ table: "expense_categories", id: c.id })}
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
      )}

      {tab === "pos" && (
        <Panel
          title="Points de vente"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() => setPos({ name: "", is_active: true, sort_order: 0 })}
              >
                <Plus className="h-4 w-4" /> Nouveau point de vente
              </button>
            )
          }
        >
          {pos && (
            <div className="mb-4 grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-4">
              <Field label="Nom">
                <input
                  className={inputCls}
                  value={pos.name ?? ""}
                  onChange={(e) => setPos({ ...pos, name: e.target.value })}
                />
              </Field>
              <Field label="Code">
                <input
                  className={inputCls}
                  value={pos.code ?? ""}
                  onChange={(e) => setPos({ ...pos, code: e.target.value })}
                />
              </Field>
              <Field label="Ville">
                <input
                  className={inputCls}
                  value={pos.city ?? ""}
                  onChange={(e) => setPos({ ...pos, city: e.target.value })}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  className={inputCls}
                  value={pos.phone ?? ""}
                  onChange={(e) => setPos({ ...pos, phone: e.target.value })}
                />
              </Field>
              <Field label="Adresse" className="sm:col-span-3">
                <input
                  className={inputCls}
                  value={pos.address ?? ""}
                  onChange={(e) => setPos({ ...pos, address: e.target.value })}
                />
              </Field>
              <div className="flex items-end gap-2">
                <button
                  className={btnPrimary}
                  onClick={() =>
                    save.mutate(
                      { table: "pos_locations", row: { ...pos } },
                      { onSuccess: () => setPos(null) },
                    )
                  }
                >
                  <Save className="h-4 w-4" /> Enregistrer
                </button>
                <button className={btnCls} onClick={() => setPos(null)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
          <DataTable
            head={["Nom", "Code", "Ville", "Téléphone", "Actif", ""]}
            empty={data.pos.length === 0}
          >
            {data.pos.map((p) => (
              <tr key={p.id}>
                <Td>{p.name}</Td>
                <Td>{p.code ?? "—"}</Td>
                <Td>{p.city ?? "—"}</Td>
                <Td>{p.phone ?? "—"}</Td>
                <Td>{p.is_active ? "Oui" : "Non"}</Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className={btnCls} onClick={() => setPos(p)}>
                        Modifier
                      </button>
                      <button
                        className={btnCls}
                        onClick={() => del.mutate({ table: "pos_locations", id: p.id })}
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
      )}
    </div>
  );
}
