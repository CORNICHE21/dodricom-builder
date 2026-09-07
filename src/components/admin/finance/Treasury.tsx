import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
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
import { useDeleteRow, useSaveRow } from "@/lib/finance-data";
import {
  ACCOUNT_TYPES,
  FIN_PAYMENT_METHODS,
  TX_TYPES,
  todayIso,
  type FinancialAccount,
  type FinancialTransaction,
  type TxType,
} from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { FINANCE_QUERY_KEY } from "@/lib/finance-data";

const emptyTx = (): Partial<FinancialTransaction> => ({
  tx_date: todayIso(),
  tx_type: "encaissement",
  account_id: null,
  target_account_id: null,
  party_name: "",
  reference: "",
  label: "",
  amount: 0,
  payment_method: "virement",
  comment: "",
  pos_id: null,
});

export function FinanceTreasury({
  scope,
  sel,
  canEdit,
}: {
  scope: Scope;
  sel: Selectors;
  canEdit: boolean;
}) {
  const { data } = scope;
  const currency = data.settings?.currency ?? "MAD";
  const save = useSaveRow();
  const del = useDeleteRow();
  const qc = useQueryClient();
  const [tx, setTx] = useState<Partial<FinancialTransaction> | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const entries = sel.transactions
    .filter((t) => ["encaissement", "depot"].includes(t.tx_type))
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const outs = sel.transactions
    .filter((t) => ["decaissement", "retrait"].includes(t.tx_type))
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const filtered = useMemo(
    () =>
      sel.transactions.filter(
        (t) =>
          (typeFilter === "all" || t.tx_type === typeFilter) &&
          `${t.label} ${t.party_name ?? ""} ${t.reference ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [sel.transactions, search, typeFilter],
  );

  async function submit() {
    if (!tx) return;
    if (!tx.label || !Number(tx.amount)) {
      toast.error("Libellé et montant obligatoires");
      return;
    }
    if (tx.tx_type === "virement" && (!tx.account_id || !tx.target_account_id)) {
      toast.error("Un virement nécessite un compte source et un compte cible");
      return;
    }
    await save.mutateAsync({ table: "financial_transactions", row: tx as Record<string, unknown> });
    toast.success("Opération enregistrée");
    setTx(null);
  }

  async function toggleReconcile(t: FinancialTransaction) {
    await supabase
      .from("financial_transactions")
      .update({ is_reconciled: !t.is_reconciled, reconciled_at: t.is_reconciled ? null : new Date().toISOString() })
      .eq("id", t.id);
    qc.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Solde total" value={fmt(sel.bankBalance + sel.cashBalance, currency)} />
        <Kpi label="Solde banques" value={fmt(sel.bankBalance, currency)} />
        <Kpi label="Solde caisses" value={fmt(sel.cashBalance, currency)} />
        <Kpi label="Entrées (période)" value={fmt(entries, currency)} tone="good" />
        <Kpi label="Sorties (période)" value={fmt(outs, currency)} tone="bad" />
        <Kpi
          label="Solde prévisionnel"
          value={fmt(sel.bankBalance + sel.cashBalance + sel.receivables - sel.supplierDebt, currency)}
          hint="+ créances − dettes"
        />
      </div>

      <Panel
        title="Opérations de trésorerie"
        actions={
          <>
            <input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} h-9 w-44 py-1.5`}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`${inputCls} h-9 w-44 py-1.5`}
            >
              <option value="all">Tous les types</option>
              {TX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {canEdit && (
              <button className={btnPrimary} onClick={() => setTx(emptyTx())}>
                <Plus className="h-4 w-4" /> Nouvelle opération
              </button>
            )}
          </>
        }
      >
        <DataTable
          head={["Date", "Type", "Compte", "Tiers", "Libellé", "Montant", "Mode", "Rappr.", ""]}
          empty={filtered.length === 0}
        >
          {filtered.map((t) => (
            <tr key={t.id}>
              <Td>{t.tx_date}</Td>
              <Td>{TX_TYPES.find((x) => x.value === t.tx_type)?.label}</Td>
              <Td>{data.accounts.find((a) => a.id === t.account_id)?.name ?? "—"}</Td>
              <Td>{t.party_name ?? "—"}</Td>
              <Td>{t.label}</Td>
              <Td>{fmt(t.amount, currency)}</Td>
              <Td>{t.payment_method}</Td>
              <Td>
                <button
                  disabled={!canEdit}
                  onClick={() => toggleReconcile(t)}
                  className="rounded-lg p-1 hover:bg-white/10"
                  aria-label="Rapprochement"
                >
                  {t.is_reconciled ? (
                    <Badge label="Rapproché" cls="bg-emerald-400/15 text-emerald-200" />
                  ) : (
                    <Badge label="À rapprocher" cls="bg-white/10 text-white/60" />
                  )}
                </button>
              </Td>
              <Td>
                {canEdit && (
                  <div className="flex gap-1">
                    <button className={btnCls} onClick={() => setTx(t)}>
                      Modifier
                    </button>
                    <button
                      className={btnCls}
                      onClick={() =>
                        del.mutate(
                          { table: "financial_transactions", id: t.id },
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
          ))}
        </DataTable>
      </Panel>

      {tx && (
        <Modal
          title={tx.id ? "Modifier l'opération" : "Nouvelle opération"}
          onClose={() => setTx(null)}
          footer={
            <>
              <button className={btnCls} onClick={() => setTx(null)}>
                Annuler
              </button>
              <button className={btnPrimary} onClick={submit} disabled={save.isPending}>
                <Check className="h-4 w-4" /> Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={tx.tx_date ?? ""}
                onChange={(e) => setTx({ ...tx, tx_date: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <select
                className={inputCls}
                value={tx.tx_type}
                onChange={(e) => setTx({ ...tx, tx_type: e.target.value as TxType })}
              >
                {TX_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Compte">
              <select
                className={inputCls}
                value={tx.account_id ?? ""}
                onChange={(e) => setTx({ ...tx, account_id: e.target.value || null })}
              >
                <option value="">—</option>
                {data.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            {tx.tx_type === "virement" && (
              <Field label="Compte cible">
                <select
                  className={inputCls}
                  value={tx.target_account_id ?? ""}
                  onChange={(e) => setTx({ ...tx, target_account_id: e.target.value || null })}
                >
                  <option value="">—</option>
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Tiers">
              <input
                className={inputCls}
                value={tx.party_name ?? ""}
                onChange={(e) => setTx({ ...tx, party_name: e.target.value })}
              />
            </Field>
            <Field label="Référence">
              <input
                className={inputCls}
                value={tx.reference ?? ""}
                onChange={(e) => setTx({ ...tx, reference: e.target.value })}
              />
            </Field>
            <Field label="Libellé" className="sm:col-span-2">
              <input
                className={inputCls}
                value={tx.label ?? ""}
                onChange={(e) => setTx({ ...tx, label: e.target.value })}
              />
            </Field>
            <Field label="Montant">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={tx.amount ?? 0}
                onChange={(e) => setTx({ ...tx, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Mode de paiement">
              <select
                className={inputCls}
                value={tx.payment_method}
                onChange={(e) => setTx({ ...tx, payment_method: e.target.value })}
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
                value={tx.pos_id ?? ""}
                onChange={(e) => setTx({ ...tx, pos_id: e.target.value || null })}
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
                value={tx.attachment_url ?? ""}
                onChange={(e) => setTx({ ...tx, attachment_url: e.target.value })}
              />
            </Field>
            <Field label="Commentaire" className="sm:col-span-2">
              <textarea
                rows={2}
                className={inputCls}
                value={tx.comment ?? ""}
                onChange={(e) => setTx({ ...tx, comment: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

const emptyAccount = (): Partial<FinancialAccount> => ({
  name: "",
  account_type: "banque",
  currency: "MAD",
  opening_balance: 0,
  is_active: true,
});

export function FinanceAccounts({
  scope,
  sel,
  canEdit,
}: {
  scope: Scope;
  sel: Selectors;
  canEdit: boolean;
}) {
  const { data } = scope;
  const currency = data.settings?.currency ?? "MAD";
  const save = useSaveRow();
  const del = useDeleteRow();
  const [acc, setAcc] = useState<Partial<FinancialAccount> | null>(null);

  return (
    <div className="space-y-6">
      <Panel
        title="Banques & caisses"
        actions={
          canEdit && (
            <button className={btnPrimary} onClick={() => setAcc(emptyAccount())}>
              <Plus className="h-4 w-4" /> Nouveau compte
            </button>
          )
        }
      >
        <DataTable
          head={["Nom", "Type", "Banque", "RIB / IBAN", "Devise", "Solde initial", "Solde actuel", "Statut", ""]}
          empty={data.accounts.length === 0}
        >
          {data.accounts.map((a) => (
            <tr key={a.id}>
              <Td>{a.name}</Td>
              <Td>{ACCOUNT_TYPES.find((t) => t.value === a.account_type)?.label}</Td>
              <Td>{a.bank_name ?? "—"}</Td>
              <Td>{a.rib ?? a.iban ?? "—"}</Td>
              <Td>{a.currency}</Td>
              <Td>{fmt(a.opening_balance, a.currency)}</Td>
              <Td>{fmt(sel.balances.get(a.id) ?? a.opening_balance, a.currency)}</Td>
              <Td>
                <Badge
                  label={a.is_active ? "Actif" : "Inactif"}
                  cls={a.is_active ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/60"}
                />
              </Td>
              <Td>
                {canEdit && (
                  <div className="flex gap-1">
                    <button className={btnCls} onClick={() => setAcc(a)}>
                      Modifier
                    </button>
                    <button
                      className={btnCls}
                      onClick={() => del.mutate({ table: "financial_accounts", id: a.id })}
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

      <Panel title="Rapprochement bancaire">
        <DataTable
          head={["Date", "Libellé", "Compte", "Montant", "État"]}
          empty={sel.transactions.length === 0}
        >
          {sel.transactions.map((t) => (
            <tr key={t.id}>
              <Td>{t.tx_date}</Td>
              <Td>{t.label}</Td>
              <Td>{data.accounts.find((a) => a.id === t.account_id)?.name ?? "—"}</Td>
              <Td>{fmt(t.amount, currency)}</Td>
              <Td>
                <Badge
                  label={t.is_reconciled ? "Rapproché" : "Non rapproché"}
                  cls={t.is_reconciled ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}
                />
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {acc && (
        <Modal
          title={acc.id ? "Modifier le compte" : "Nouveau compte"}
          onClose={() => setAcc(null)}
          footer={
            <>
              <button className={btnCls} onClick={() => setAcc(null)}>
                Annuler
              </button>
              <button
                className={btnPrimary}
                onClick={async () => {
                  if (!acc.name) return toast.error("Nom obligatoire");
                  await save.mutateAsync({
                    table: "financial_accounts",
                    row: acc as Record<string, unknown>,
                  });
                  toast.success("Compte enregistré");
                  setAcc(null);
                }}
              >
                <Check className="h-4 w-4" /> Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <input
                className={inputCls}
                value={acc.name ?? ""}
                onChange={(e) => setAcc({ ...acc, name: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <select
                className={inputCls}
                value={acc.account_type}
                onChange={(e) =>
                  setAcc({ ...acc, account_type: e.target.value as FinancialAccount["account_type"] })
                }
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Banque">
              <input
                className={inputCls}
                value={acc.bank_name ?? ""}
                onChange={(e) => setAcc({ ...acc, bank_name: e.target.value })}
              />
            </Field>
            <Field label="Devise">
              <input
                className={inputCls}
                value={acc.currency ?? "MAD"}
                onChange={(e) => setAcc({ ...acc, currency: e.target.value })}
              />
            </Field>
            <Field label="IBAN">
              <input
                className={inputCls}
                value={acc.iban ?? ""}
                onChange={(e) => setAcc({ ...acc, iban: e.target.value })}
              />
            </Field>
            <Field label="RIB">
              <input
                className={inputCls}
                value={acc.rib ?? ""}
                onChange={(e) => setAcc({ ...acc, rib: e.target.value })}
              />
            </Field>
            <Field label="Solde initial">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={acc.opening_balance ?? 0}
                onChange={(e) => setAcc({ ...acc, opening_balance: Number(e.target.value) })}
              />
            </Field>
            <Field label="Compte comptable">
              <input
                className={inputCls}
                value={acc.accounting_account ?? ""}
                onChange={(e) => setAcc({ ...acc, accounting_account: e.target.value })}
              />
            </Field>
            <Field label="Point de vente">
              <select
                className={inputCls}
                value={acc.pos_id ?? ""}
                onChange={(e) => setAcc({ ...acc, pos_id: e.target.value || null })}
              >
                <option value="">—</option>
                {data.pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select
                className={inputCls}
                value={acc.is_active ? "1" : "0"}
                onChange={(e) => setAcc({ ...acc, is_active: e.target.value === "1" })}
              >
                <option value="1">Actif</option>
                <option value="0">Inactif</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
