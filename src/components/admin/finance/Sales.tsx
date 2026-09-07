import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge, DataTable, Kpi, Panel, Td, btnCls, fmt, inputCls } from "./ui";
import type { Scope, Selectors } from "./scope";
import { SALES_STATUS_META, type SalesRow } from "@/lib/finance";
import { docLabel as docLabelSafe } from "@/lib/billing";
import { exportCsv } from "@/lib/finance-data";

export function FinanceSales({
  scope,
  sel,
  canExport,
}: {
  scope: Scope;
  sel: Selectors;
  canExport: boolean;
}) {
  const currency = scope.data.settings?.currency ?? "MAD";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      sel.rows.filter(
        (r) =>
          (status === "all" || r.computedStatus === status) &&
          `${r.doc.number} ${r.doc.client_name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [sel.rows, search, status],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi label="CA HT" value={fmt(sel.caHt, currency)} />
        <Kpi label="CA TTC" value={fmt(sel.caTtc, currency)} />
        <Kpi label="TVA collectée" value={fmt(sel.vatCollected, currency)} />
        <Kpi label="Encaissé" value={fmt(sel.encaisse, currency)} tone="good" />
        <Kpi label="Reste à encaisser" value={fmt(sel.receivables, currency)} tone="bad" />
      </div>

      <Panel
        title="Documents de vente"
        actions={
          <>
            <input
              placeholder="N° ou client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} h-9 w-44 py-1.5`}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputCls} h-9 w-40 py-1.5`}
            >
              <option value="all">Tous les statuts</option>
              {(Object.keys(SALES_STATUS_META) as SalesRow["computedStatus"][]).map((k) => (
                <option key={k} value={k}>
                  {SALES_STATUS_META[k].label}
                </option>
              ))}
            </select>
            {canExport && (
              <button
                className={btnCls}
                onClick={() =>
                  exportCsv("ventes.csv", [
                    ["Numéro", "Type", "Date", "Client", "HT", "TVA", "TTC", "Encaissé", "Reste", "Échéance", "Statut"],
                    ...rows.map((r) => [
                      r.doc.number,
                      docLabelSafe(r.doc.doc_type),
                      r.doc.issue_date,
                      r.doc.client_name,
                      r.doc.total_ht,
                      r.doc.total_vat,
                      r.doc.total_ttc,
                      r.paid,
                      r.remaining,
                      r.doc.due_date ?? "",
                      SALES_STATUS_META[r.computedStatus].label,
                    ]),
                  ])
                }
              >
                Export CSV
              </button>
            )}
          </>
        }
      >
        <DataTable
          head={["N°", "Type", "Date", "Client", "HT", "TVA", "TTC", "Encaissé", "Reste", "Échéance", "Statut", ""]}
          empty={rows.length === 0}
        >
          {rows.map((r) => (
            <tr key={r.doc.id}>
              <Td>{r.doc.number}</Td>
              <Td>{docLabelSafe(r.doc.doc_type)}</Td>
              <Td>{r.doc.issue_date}</Td>
              <Td>{r.doc.client_name}</Td>
              <Td>{fmt(r.doc.total_ht, currency)}</Td>
              <Td>{fmt(r.doc.total_vat, currency)}</Td>
              <Td>{fmt(r.doc.total_ttc, currency)}</Td>
              <Td>{fmt(r.paid, currency)}</Td>
              <Td>{fmt(r.remaining, currency)}</Td>
              <Td>{r.doc.due_date ?? "—"}</Td>
              <Td>
                <Badge
                  label={SALES_STATUS_META[r.computedStatus].label}
                  cls={SALES_STATUS_META[r.computedStatus].cls}
                />
              </Td>
              <Td>
                <Link to="/admin/billing" className={btnCls}>
                  Ouvrir
                </Link>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
