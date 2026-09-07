import { useMemo, useState } from "react";
import { DataTable, Kpi, Panel, Td, btnCls, fmt } from "./ui";
import type { Scope, Selectors } from "./scope";
import { monthKey, monthLabel, num } from "@/lib/finance";
import { exportCsv } from "@/lib/finance-data";

type ReportKey = "resultat" | "tresorerie" | "clients" | "fournisseurs" | "mensuel";

const REPORTS: { key: ReportKey; label: string }[] = [
  { key: "resultat", label: "Compte de résultat" },
  { key: "tresorerie", label: "Trésorerie" },
  { key: "clients", label: "Créances clients" },
  { key: "fournisseurs", label: "Dettes fournisseurs" },
  { key: "mensuel", label: "Synthèse mensuelle" },
];

export function FinanceReports({
  scope,
  sel,
  canExport,
}: {
  scope: Scope;
  sel: Selectors;
  canExport: boolean;
}) {
  const currency = scope.data.settings?.currency ?? "MAD";
  const [tab, setTab] = useState<ReportKey>("resultat");

  const monthly = useMemo(() => {
    const map = new Map<string, { ca: number; enc: number; dep: number; achat: number }>();
    const touch = (k: string) => {
      if (!map.has(k)) map.set(k, { ca: 0, enc: 0, dep: 0, achat: 0 });
      return map.get(k)!;
    };
    sel.salesRows.forEach((r) => (touch(monthKey(r.doc.issue_date)).ca += num(r.doc.total_ht)));
    sel.payments.forEach((p) => (touch(monthKey(p.paid_at)).enc += num(p.amount)));
    sel.expenses.forEach((e) => (touch(monthKey(e.expense_date)).dep += num(e.amount_ht)));
    sel.supplierInvoices.forEach(
      (i) => (touch(monthKey(i.issue_date)).achat += num(i.total_ht)),
    );
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ key: k, label: monthLabel(k), ...v, resultat: v.ca - v.dep - v.achat }));
  }, [sel]);

  const resultLines: [string, number][] = [
    ["Chiffre d'affaires HT", sel.caHt],
    ["Avoirs", -sel.creditsTtc],
    ["Achats fournisseurs HT", -sel.purchasesHt],
    ["Charges / dépenses HT", -sel.expenseHt],
    ["Résultat", sel.result],
  ];

  const clientRows = useMemo(() => {
    const map = new Map<string, number>();
    sel.allRows.forEach((r) => {
      if (r.remaining <= 0) return;
      map.set(r.doc.client_name, (map.get(r.doc.client_name) ?? 0) + r.remaining);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [sel.allRows]);

  const supplierRows = useMemo(() => {
    const map = new Map<string, number>();
    scope.data.supplierInvoices
      .filter((i) => i.status !== "paye" && i.status !== "annule")
      .forEach((i) => {
        const name = scope.data.suppliers.find((s) => s.id === i.supplier_id)?.name ?? "—";
        map.set(name, (map.get(name) ?? 0) + num(i.total_ttc));
      });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [scope.data.supplierInvoices, scope.data.suppliers]);

  const treasuryRows = useMemo(
    () =>
      sel.accounts.map((a) => ({
        name: a.name,
        type: a.account_type,
        balance: sel.balances.get(a.id) ?? 0,
      })),
    [sel.accounts, sel.balances],
  );

  function doExport() {
    if (tab === "resultat")
      exportCsv("compte-resultat.csv", [["Poste", "Montant"], ...resultLines]);
    else if (tab === "tresorerie")
      exportCsv("tresorerie.csv", [
        ["Compte", "Type", "Solde"],
        ...treasuryRows.map((r) => [r.name, r.type, r.balance]),
      ]);
    else if (tab === "clients")
      exportCsv("creances-clients.csv", [["Client", "Restant dû"], ...clientRows]);
    else if (tab === "fournisseurs")
      exportCsv("dettes-fournisseurs.csv", [["Fournisseur", "Restant dû"], ...supplierRows]);
    else
      exportCsv("synthese-mensuelle.csv", [
        ["Mois", "CA HT", "Encaissements", "Achats HT", "Dépenses HT", "Résultat"],
        ...monthly.map((m) => [m.label, m.ca, m.enc, m.achat, m.dep, m.resultat]),
      ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Chiffre d'affaires HT" value={fmt(sel.caHt, currency)} />
        <Kpi label="Encaissements" value={fmt(sel.encaisse, currency)} />
        <Kpi label="Charges + achats" value={fmt(sel.expenseHt + sel.purchasesHt, currency)} />
        <Kpi
          label="Résultat"
          value={fmt(sel.result, currency)}
          tone={sel.result >= 0 ? "good" : "bad"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => setTab(r.key)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
              tab === r.key
                ? "bg-[var(--gradient-brand)] text-white"
                : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Panel
        title={REPORTS.find((r) => r.key === tab)?.label}
        actions={
          canExport && (
            <button className={btnCls} onClick={doExport}>
              Export CSV
            </button>
          )
        }
      >
        {tab === "resultat" && (
          <DataTable head={["Poste", "Montant"]} empty={false}>
            {resultLines.map(([label, value], i) => (
              <tr key={label} className={i === resultLines.length - 1 ? "font-semibold" : ""}>
                <Td>{label}</Td>
                <Td className={value < 0 ? "text-rose-300" : "text-white"}>
                  {fmt(value, currency)}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "tresorerie" && (
          <DataTable head={["Compte", "Type", "Solde"]} empty={treasuryRows.length === 0}>
            {treasuryRows.map((r) => (
              <tr key={r.name}>
                <Td>{r.name}</Td>
                <Td>{r.type}</Td>
                <Td>{fmt(r.balance, currency)}</Td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "clients" && (
          <DataTable head={["Client", "Restant dû"]} empty={clientRows.length === 0}>
            {clientRows.map(([name, value]) => (
              <tr key={name}>
                <Td className="max-w-[280px] truncate">{name}</Td>
                <Td>{fmt(value, currency)}</Td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "fournisseurs" && (
          <DataTable head={["Fournisseur", "Restant dû"]} empty={supplierRows.length === 0}>
            {supplierRows.map(([name, value]) => (
              <tr key={name}>
                <Td className="max-w-[280px] truncate">{name}</Td>
                <Td>{fmt(value, currency)}</Td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "mensuel" && (
          <DataTable
            head={["Mois", "CA HT", "Encaissements", "Achats HT", "Dépenses HT", "Résultat"]}
            empty={monthly.length === 0}
          >
            {monthly.map((m) => (
              <tr key={m.key}>
                <Td>{m.label}</Td>
                <Td>{fmt(m.ca, currency)}</Td>
                <Td>{fmt(m.enc, currency)}</Td>
                <Td>{fmt(m.achat, currency)}</Td>
                <Td>{fmt(m.dep, currency)}</Td>
                <Td className={m.resultat >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {fmt(m.resultat, currency)}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
