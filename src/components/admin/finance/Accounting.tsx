import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
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
import { useDeleteRow, useSaveEntry, useSaveRow, exportCsv } from "@/lib/finance-data";
import {
  entryBalanced,
  num,
  todayIso,
  type AccountingAccount,
  type AccountingEntry,
  type AccountingJournal,
  type FiscalPeriod,
} from "@/lib/finance";

type Tab = "plan" | "journaux" | "ecritures" | "grand-livre" | "balance" | "exercices";

const TABS: { key: Tab; label: string }[] = [
  { key: "plan", label: "Plan comptable" },
  { key: "journaux", label: "Journaux" },
  { key: "ecritures", label: "Écritures" },
  { key: "grand-livre", label: "Grand livre" },
  { key: "balance", label: "Balance" },
  { key: "exercices", label: "Exercices" },
];

type LineDraft = { account_code: string; label: string; debit: number; credit: number };

export function FinanceAccounting({
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
  const [tab, setTab] = useState<Tab>("plan");
  const save = useSaveRow();
  const del = useDeleteRow();
  const saveEntry = useSaveEntry();

  const [acc, setAcc] = useState<Partial<AccountingAccount> | null>(null);
  const [jr, setJr] = useState<Partial<AccountingJournal> | null>(null);
  const [per, setPer] = useState<Partial<FiscalPeriod> | null>(null);
  const [entry, setEntry] = useState<Partial<AccountingEntry> | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);

  const entriesInRange = useMemo(
    () => data.entries.filter((e) => sel.transactions || true).filter((e) => e.entry_date),
    [data.entries, sel.transactions],
  );

  const linesOf = (entryId: string) =>
    data.entryLines.filter((l) => l.entry_id === entryId).sort((a, b) => a.sort_order - b.sort_order);

  /** Grand livre : lignes groupées par compte. */
  const ledger = useMemo(() => {
    const byEntry = new Map(data.entries.map((e) => [e.id, e]));
    const map = new Map<string, { code: string; debit: number; credit: number; rows: { date: string; label: string; debit: number; credit: number; piece: string }[] }>();
    for (const l of data.entryLines) {
      const e = byEntry.get(l.entry_id);
      if (!e) continue;
      if (!map.has(l.account_code))
        map.set(l.account_code, { code: l.account_code, debit: 0, credit: 0, rows: [] });
      const g = map.get(l.account_code)!;
      g.debit += num(l.debit);
      g.credit += num(l.credit);
      g.rows.push({
        date: e.entry_date,
        label: l.label || e.label,
        debit: num(l.debit),
        credit: num(l.credit),
        piece: e.piece_number ?? "",
      });
    }
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [data.entries, data.entryLines]);

  const draftBalance = entryBalanced(lines);

  function openEntry(e?: AccountingEntry) {
    if (e) {
      setEntry(e);
      setLines(
        linesOf(e.id).map((l) => ({
          account_code: l.account_code,
          label: l.label,
          debit: num(l.debit),
          credit: num(l.credit),
        })),
      );
    } else {
      setEntry({
        entry_date: todayIso(),
        journal_code: data.journals[0]?.code ?? "OD",
        piece_number: "",
        label: "",
        party_name: "",
        pos_id: null,
        is_posted: false,
      });
      setLines([
        { account_code: "", label: "", debit: 0, credit: 0 },
        { account_code: "", label: "", debit: 0, credit: 0 },
      ]);
    }
  }

  async function submitEntry() {
    if (!entry?.label?.trim()) return toast.error("Libellé requis");
    if (!draftBalance.balanced) return toast.error("Écriture déséquilibrée : Débit ≠ Crédit");
    try {
      await saveEntry.mutateAsync({
        entry: {
          ...entry,
          total_debit: draftBalance.debit,
          total_credit: draftBalance.credit,
        } as Record<string, unknown>,
        lines: lines.filter((l) => l.account_code.trim()) as unknown as Record<string, unknown>[],
      });
      toast.success("Écriture enregistrée");
      setEntry(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded-xl bg-[var(--gradient-brand)] px-3 py-1.5 text-xs font-semibold text-white"
                : btnCls
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plan" && (
        <Panel
          title="Plan comptable"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() => setAcc({ code: "", label: "", account_type: "charge", is_active: true })}
              >
                <Plus className="h-4 w-4" /> Compte
              </button>
            )
          }
        >
          <DataTable head={["Code", "Libellé", "Type", "Parent", "Actif", ""]} empty={data.chart.length === 0}>
            {data.chart.map((a) => (
              <tr key={a.id}>
                <Td>{a.code}</Td>
                <Td>{a.label}</Td>
                <Td>{a.account_type}</Td>
                <Td>{a.parent_code ?? "—"}</Td>
                <Td>{a.is_active ? "Oui" : "Non"}</Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className={btnCls} onClick={() => setAcc(a)}>
                        Éditer
                      </button>
                      <button
                        className={btnCls}
                        onClick={() => del.mutate({ table: "accounting_accounts", id: a.id })}
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

      {tab === "journaux" && (
        <Panel
          title="Journaux"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() => setJr({ code: "", label: "", journal_type: "divers", is_active: true })}
              >
                <Plus className="h-4 w-4" /> Journal
              </button>
            )
          }
        >
          <DataTable head={["Code", "Libellé", "Type", "Actif", ""]} empty={data.journals.length === 0}>
            {data.journals.map((j) => (
              <tr key={j.id}>
                <Td>{j.code}</Td>
                <Td>{j.label}</Td>
                <Td>{j.journal_type}</Td>
                <Td>{j.is_active ? "Oui" : "Non"}</Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className={btnCls} onClick={() => setJr(j)}>
                        Éditer
                      </button>
                      <button
                        className={btnCls}
                        onClick={() => del.mutate({ table: "accounting_journals", id: j.id })}
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

      {tab === "ecritures" && (
        <Panel
          title="Écritures comptables"
          actions={
            canEdit && (
              <button className={btnPrimary} onClick={() => openEntry()}>
                <Plus className="h-4 w-4" /> Écriture
              </button>
            )
          }
        >
          <DataTable
            head={["Date", "Journal", "Pièce", "Libellé", "Tiers", "Débit", "Crédit", "État", ""]}
            empty={entriesInRange.length === 0}
          >
            {entriesInRange.map((e) => {
              const b = entryBalanced(linesOf(e.id));
              return (
                <tr key={e.id}>
                  <Td>{e.entry_date}</Td>
                  <Td>{e.journal_code}</Td>
                  <Td>{e.piece_number ?? "—"}</Td>
                  <Td className="max-w-[220px] truncate">{e.label}</Td>
                  <Td>{e.party_name ?? "—"}</Td>
                  <Td>{fmt(b.debit, currency)}</Td>
                  <Td>{fmt(b.credit, currency)}</Td>
                  <Td>
                    {b.balanced ? (
                      <Badge label="Équilibrée" cls="bg-emerald-400/15 text-emerald-200" />
                    ) : (
                      <Badge label="Déséquilibrée" cls="bg-rose-400/15 text-rose-200" />
                    )}
                  </Td>
                  <Td>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button className={btnCls} onClick={() => openEntry(e)}>
                          Éditer
                        </button>
                        <button
                          className={btnCls}
                          onClick={() => del.mutate({ table: "accounting_entries", id: e.id })}
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
      )}

      {tab === "grand-livre" && (
        <div className="space-y-4">
          {ledger.length === 0 && <Panel title="Grand livre">
            <p className="text-sm text-white/40">Aucune donnée disponible</p>
          </Panel>}
          {ledger.map((g) => (
            <Panel
              key={g.code}
              title={`${g.code} — ${data.chart.find((c) => c.code === g.code)?.label ?? ""}`}
              actions={
                <span className="text-xs text-white/60">
                  Solde : {fmt(g.debit - g.credit, currency)}
                </span>
              }
            >
              <DataTable head={["Date", "Pièce", "Libellé", "Débit", "Crédit"]} empty={false}>
                {g.rows.map((r, i) => (
                  <tr key={i}>
                    <Td>{r.date}</Td>
                    <Td>{r.piece || "—"}</Td>
                    <Td>{r.label}</Td>
                    <Td>{fmt(r.debit, currency)}</Td>
                    <Td>{fmt(r.credit, currency)}</Td>
                  </tr>
                ))}
              </DataTable>
            </Panel>
          ))}
        </div>
      )}

      {tab === "balance" && (
        <Panel
          title="Balance générale"
          actions={
            canExport && (
              <button
                className={btnCls}
                onClick={() =>
                  exportCsv("balance.csv", [
                    ["Compte", "Libellé", "Débit", "Crédit", "Solde"],
                    ...ledger.map((g) => [
                      g.code,
                      data.chart.find((c) => c.code === g.code)?.label ?? "",
                      g.debit,
                      g.credit,
                      g.debit - g.credit,
                    ]),
                  ])
                }
              >
                Export CSV
              </button>
            )
          }
        >
          <DataTable head={["Compte", "Libellé", "Débit", "Crédit", "Solde"]} empty={ledger.length === 0}>
            {ledger.map((g) => (
              <tr key={g.code}>
                <Td>{g.code}</Td>
                <Td>{data.chart.find((c) => c.code === g.code)?.label ?? "—"}</Td>
                <Td>{fmt(g.debit, currency)}</Td>
                <Td>{fmt(g.credit, currency)}</Td>
                <Td>{fmt(g.debit - g.credit, currency)}</Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}

      {tab === "exercices" && (
        <Panel
          title="Exercices comptables"
          actions={
            canEdit && (
              <button
                className={btnPrimary}
                onClick={() =>
                  setPer({
                    label: String(new Date().getFullYear()),
                    start_date: `${new Date().getFullYear()}-01-01`,
                    end_date: `${new Date().getFullYear()}-12-31`,
                    is_closed: false,
                  })
                }
              >
                <Plus className="h-4 w-4" /> Exercice
              </button>
            )
          }
        >
          <DataTable head={["Libellé", "Début", "Fin", "État", ""]} empty={data.periods.length === 0}>
            {data.periods.map((p) => (
              <tr key={p.id}>
                <Td>{p.label}</Td>
                <Td>{p.start_date}</Td>
                <Td>{p.end_date}</Td>
                <Td>
                  <Badge
                    label={p.is_closed ? "Clôturé" : "Ouvert"}
                    cls={p.is_closed ? "bg-white/10 text-white/70" : "bg-emerald-400/15 text-emerald-200"}
                  />
                </Td>
                <Td>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className={btnCls} onClick={() => setPer(p)}>
                        Éditer
                      </button>
                      <button
                        className={btnCls}
                        onClick={() =>
                          save.mutate({
                            table: "fiscal_periods",
                            row: { id: p.id, is_closed: !p.is_closed },
                          })
                        }
                      >
                        {p.is_closed ? "Rouvrir" : "Clôturer"}
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}

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
                  if (!acc.code?.trim()) return toast.error("Code requis");
                  await save.mutateAsync({ table: "accounting_accounts", row: acc as Record<string, unknown> });
                  toast.success("Compte enregistré");
                  setAcc(null);
                }}
              >
                Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code">
              <input className={inputCls} value={acc.code ?? ""} onChange={(e) => setAcc({ ...acc, code: e.target.value })} />
            </Field>
            <Field label="Libellé">
              <input className={inputCls} value={acc.label ?? ""} onChange={(e) => setAcc({ ...acc, label: e.target.value })} />
            </Field>
            <Field label="Type">
              <select
                className={inputCls}
                value={acc.account_type ?? "charge"}
                onChange={(e) => setAcc({ ...acc, account_type: e.target.value })}
              >
                {["actif", "passif", "charge", "produit", "tiers", "tresorerie"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Compte parent">
              <input
                className={inputCls}
                value={acc.parent_code ?? ""}
                onChange={(e) => setAcc({ ...acc, parent_code: e.target.value || null })}
              />
            </Field>
          </div>
        </Modal>
      )}

      {jr && (
        <Modal
          title={jr.id ? "Modifier le journal" : "Nouveau journal"}
          onClose={() => setJr(null)}
          footer={
            <>
              <button className={btnCls} onClick={() => setJr(null)}>
                Annuler
              </button>
              <button
                className={btnPrimary}
                onClick={async () => {
                  if (!jr.code?.trim()) return toast.error("Code requis");
                  await save.mutateAsync({ table: "accounting_journals", row: jr as Record<string, unknown> });
                  toast.success("Journal enregistré");
                  setJr(null);
                }}
              >
                Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code">
              <input className={inputCls} value={jr.code ?? ""} onChange={(e) => setJr({ ...jr, code: e.target.value })} />
            </Field>
            <Field label="Libellé">
              <input className={inputCls} value={jr.label ?? ""} onChange={(e) => setJr({ ...jr, label: e.target.value })} />
            </Field>
            <Field label="Type">
              <select
                className={inputCls}
                value={jr.journal_type ?? "divers"}
                onChange={(e) => setJr({ ...jr, journal_type: e.target.value })}
              >
                {["achat", "vente", "banque", "caisse", "divers"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {per && (
        <Modal
          title={per.id ? "Modifier l'exercice" : "Nouvel exercice"}
          onClose={() => setPer(null)}
          footer={
            <>
              <button className={btnCls} onClick={() => setPer(null)}>
                Annuler
              </button>
              <button
                className={btnPrimary}
                onClick={async () => {
                  await save.mutateAsync({ table: "fiscal_periods", row: per as Record<string, unknown> });
                  toast.success("Exercice enregistré");
                  setPer(null);
                }}
              >
                Enregistrer
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Libellé">
              <input className={inputCls} value={per.label ?? ""} onChange={(e) => setPer({ ...per, label: e.target.value })} />
            </Field>
            <Field label="Début">
              <input type="date" className={inputCls} value={per.start_date ?? ""} onChange={(e) => setPer({ ...per, start_date: e.target.value })} />
            </Field>
            <Field label="Fin">
              <input type="date" className={inputCls} value={per.end_date ?? ""} onChange={(e) => setPer({ ...per, end_date: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}

      {entry && (
        <Modal
          title={entry.id ? "Modifier l'écriture" : "Nouvelle écriture"}
          onClose={() => setEntry(null)}
          wide
          footer={
            <>
              <button className={btnCls} onClick={() => setEntry(null)}>
                Annuler
              </button>
              <button className={btnPrimary} onClick={submitEntry} disabled={saveEntry.isPending}>
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
                value={entry.entry_date ?? ""}
                onChange={(e) => setEntry({ ...entry, entry_date: e.target.value })}
              />
            </Field>
            <Field label="Journal">
              <select
                className={inputCls}
                value={entry.journal_code ?? ""}
                onChange={(e) => setEntry({ ...entry, journal_code: e.target.value })}
              >
                {data.journals.map((j) => (
                  <option key={j.id} value={j.code}>
                    {j.code} — {j.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="N° pièce">
              <input
                className={inputCls}
                value={entry.piece_number ?? ""}
                onChange={(e) => setEntry({ ...entry, piece_number: e.target.value })}
              />
            </Field>
            <Field label="Tiers">
              <input
                className={inputCls}
                value={entry.party_name ?? ""}
                onChange={(e) => setEntry({ ...entry, party_name: e.target.value })}
              />
            </Field>
            <Field label="Libellé" className="sm:col-span-2">
              <input
                className={inputCls}
                value={entry.label ?? ""}
                onChange={(e) => setEntry({ ...entry, label: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-5 space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[120px_1fr_120px_120px_40px]">
                <input
                  placeholder="Compte"
                  className={inputCls}
                  value={l.account_code}
                  onChange={(e) =>
                    setLines(lines.map((x, j) => (j === i ? { ...x, account_code: e.target.value } : x)))
                  }
                />
                <input
                  placeholder="Libellé"
                  className={inputCls}
                  value={l.label}
                  onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Débit"
                  className={inputCls}
                  value={l.debit}
                  onChange={(e) =>
                    setLines(lines.map((x, j) => (j === i ? { ...x, debit: Number(e.target.value) } : x)))
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Crédit"
                  className={inputCls}
                  value={l.credit}
                  onChange={(e) =>
                    setLines(lines.map((x, j) => (j === i ? { ...x, credit: Number(e.target.value) } : x)))
                  }
                />
                <button className={btnCls} onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              className={btnCls}
              onClick={() => setLines([...lines, { account_code: "", label: "", debit: 0, credit: 0 }])}
            >
              <Plus className="h-3.5 w-3.5" /> Ligne
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-white/60">Débit : {fmt(draftBalance.debit, currency)}</span>
            <span className="text-white/60">Crédit : {fmt(draftBalance.credit, currency)}</span>
            {!draftBalance.balanced && (
              <span className="inline-flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="h-4 w-4" /> Écriture non équilibrée
              </span>
            )}
          </div>
        </Modal>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Comptes" value={String(data.chart.length)} />
        <Kpi label="Journaux" value={String(data.journals.length)} />
        <Kpi label="Écritures" value={String(data.entries.length)} />
      </div>
    </div>
  );
}
