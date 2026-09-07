import { useMemo } from "react";
import { DataTable, Kpi, Panel, Td, btnCls, fmt } from "./ui";
import type { Scope, Selectors } from "./scope";
import { docLabel } from "@/lib/billing";
import { num } from "@/lib/finance";
import { exportCsv } from "@/lib/finance-data";

type VatRow = {
  date: string;
  type: string;
  party: string;
  base: number;
  rate: number;
  vat: number;
  doc: string;
  sens: "Collectée" | "Déductible";
};

export function FinanceVat({
  scope,
  sel,
  canExport,
}: {
  scope: Scope;
  sel: Selectors;
  canExport: boolean;
}) {
  const currency = scope.data.settings?.currency ?? "MAD";

  const rows = useMemo<VatRow[]>(() => {
    const out: VatRow[] = [];
    for (const r of sel.salesRows)
      out.push({
        date: r.doc.issue_date,
        type: docLabel(r.doc.doc_type),
        party: r.doc.client_name,
        base: num(r.doc.total_ht),
        rate: num(r.doc.vat_rate),
        vat: num(r.doc.total_vat),
        doc: r.doc.number,
        sens: "Collectée",
      });
    for (const i of sel.supplierInvoices)
      out.push({
        date: i.issue_date,
        type: "Facture fournisseur",
        party: scope.data.suppliers.find((s) => s.id === i.supplier_id)?.name ?? "—",
        base: num(i.total_ht),
        rate: num(i.vat_rate),
        vat: num(i.total_vat),
        doc: i.reference,
        sens: "Déductible",
      });
    for (const e of sel.expenses)
      out.push({
        date: e.expense_date,
        type: "Dépense",
        party: e.description,
        base: num(e.amount_ht),
        rate: num(e.vat_rate),
        vat: num(e.vat_amount),
        doc: "—",
        sens: "Déductible",
      });
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [sel, scope.data.suppliers]);

  const due = sel.vatCollected - sel.vatDeductible;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="TVA collectée" value={fmt(sel.vatCollected, currency)} />
        <Kpi label="TVA déductible" value={fmt(sel.vatDeductible, currency)} />
        <Kpi
          label="TVA à payer"
          value={fmt(Math.max(due, 0), currency)}
          tone={due > 0 ? "bad" : "neutral"}
        />
        <Kpi
          label="TVA créditrice"
          value={fmt(Math.max(-due, 0), currency)}
          tone={due < 0 ? "good" : "neutral"}
        />
      </div>

      <Panel
        title="Détail TVA"
        actions={
          canExport && (
            <button
              className={btnCls}
              onClick={() =>
                exportCsv("tva.csv", [
                  ["Date", "Type", "Tiers", "Base HT", "Taux", "TVA", "Document", "Sens"],
                  ...rows.map((r) => [
                    r.date,
                    r.type,
                    r.party,
                    r.base,
                    r.rate,
                    r.vat,
                    r.doc,
                    r.sens,
                  ]),
                ])
              }
            >
              Export CSV
            </button>
          )
        }
      >
        <DataTable
          head={["Date", "Type", "Tiers", "Base HT", "Taux", "TVA", "Document", "Sens"]}
          empty={rows.length === 0}
        >
          {rows.map((r, i) => (
            <tr key={`${r.doc}-${i}`}>
              <Td>{r.date}</Td>
              <Td>{r.type}</Td>
              <Td className="max-w-[220px] truncate">{r.party}</Td>
              <Td>{fmt(r.base, currency)}</Td>
              <Td>{r.rate}%</Td>
              <Td>{fmt(r.vat, currency)}</Td>
              <Td>{r.doc}</Td>
              <Td>{r.sens}</Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
