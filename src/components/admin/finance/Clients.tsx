import { useMemo, useState } from "react";
import { DataTable, Empty, Kpi, Panel, Td, btnCls, fmt, inputCls } from "./ui";
import type { Scope, Selectors } from "./scope";
import { agingFor, isCreditNote, isSalesDoc, type SalesRow } from "@/lib/finance";
import { exportCsv } from "@/lib/finance-data";

type ClientAgg = {
  name: string;
  invoiced: number;
  paid: number;
  credits: number;
  remaining: number;
  lateDays: number;
  rows: SalesRow[];
};

export function FinanceClients({
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
  const [open, setOpen] = useState<string | null>(null);

  const clients = useMemo<ClientAgg[]>(() => {
    const map = new Map<string, ClientAgg>();
    for (const r of sel.allRows) {
      const name = r.doc.client_name || "—";
      if (!map.has(name))
        map.set(name, { name, invoiced: 0, paid: 0, credits: 0, remaining: 0, lateDays: 0, rows: [] });
      const c = map.get(name)!;
      c.rows.push(r);
      if (isSalesDoc(r.doc)) {
        c.invoiced += Number(r.doc.total_ttc || 0);
        c.paid += r.paid;
        c.remaining += r.remaining;
        if (r.overdue && r.doc.due_date) {
          const late = Math.round(
            (Date.now() - new Date(`${r.doc.due_date}T00:00:00`).getTime()) / 86_400_000,
          );
          c.lateDays = Math.max(c.lateDays, late);
        }
      }
      if (isCreditNote(r.doc)) c.credits += Number(r.doc.total_ttc || 0);
    }
    return [...map.values()].sort((a, b) => b.remaining - a.remaining);
  }, [sel.allRows]);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const aging = useMemo(() => agingFor(sel.allRows.filter((r) => isSalesDoc(r.doc))), [sel.allRows]);
  const current = clients.find((c) => c.name === open) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="0–30 jours" value={fmt(aging.b030, currency)} />
        <Kpi label="31–60 jours" value={fmt(aging.b3160, currency)} />
        <Kpi label="61–90 jours" value={fmt(aging.b6190, currency)} tone="bad" />
        <Kpi label="+90 jours" value={fmt(aging.b90, currency)} tone="bad" />
      </div>

      <Panel
        title="Créances clients"
        actions={
          <>
            <input
              placeholder="Client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} h-9 w-44 py-1.5`}
            />
            {canExport && (
              <button
                className={btnCls}
                onClick={() =>
                  exportCsv("creances-clients.csv", [
                    ["Client", "Facturé", "Encaissé", "Avoirs", "Reste", "Retard (j)"],
                    ...filtered.map((c) => [c.name, c.invoiced, c.paid, c.credits, c.remaining, c.lateDays]),
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
          head={["Client", "Total facturé", "Encaissé", "Avoirs", "Reste à payer", "Retard", ""]}
          empty={filtered.length === 0}
        >
          {filtered.map((c) => (
            <tr key={c.name}>
              <Td>{c.name}</Td>
              <Td>{fmt(c.invoiced, currency)}</Td>
              <Td>{fmt(c.paid, currency)}</Td>
              <Td>{fmt(c.credits, currency)}</Td>
              <Td className={c.remaining > 0 ? "text-rose-200" : ""}>{fmt(c.remaining, currency)}</Td>
              <Td>{c.lateDays > 0 ? `${c.lateDays} j` : "—"}</Td>
              <Td>
                <button className={btnCls} onClick={() => setOpen(c.name === open ? null : c.name)}>
                  Fiche
                </button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {current && (
        <Panel title={`Fiche financière — ${current.name}`}>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Facturé" value={fmt(current.invoiced, currency)} />
            <Kpi label="Encaissé" value={fmt(current.paid, currency)} />
            <Kpi label="Avoirs" value={fmt(current.credits, currency)} />
            <Kpi label="Solde" value={fmt(current.remaining, currency)} tone={current.remaining > 0 ? "bad" : "good"} />
          </div>
          <DataTable head={["N°", "Date", "TTC", "Encaissé", "Reste", "Échéance"]} empty={current.rows.length === 0}>
            {current.rows.map((r) => (
              <tr key={r.doc.id}>
                <Td>{r.doc.number}</Td>
                <Td>{r.doc.issue_date}</Td>
                <Td>{fmt(r.doc.total_ttc, currency)}</Td>
                <Td>{fmt(r.paid, currency)}</Td>
                <Td>{fmt(r.remaining, currency)}</Td>
                <Td>{r.doc.due_date ?? "—"}</Td>
              </tr>
            ))}
          </DataTable>
          <h4 className="mt-6 mb-2 text-sm font-semibold text-white">Historique des paiements</h4>
          {(() => {
            const pays = scope.data.payments.filter((p) =>
              current.rows.some((r) => r.doc.id === p.document_id),
            );
            if (pays.length === 0) return <Empty label="Aucun paiement enregistré" />;
            return (
              <DataTable head={["Date", "Montant", "Mode", "Référence"]}>
                {pays.map((p) => (
                  <tr key={p.id}>
                    <Td>{p.paid_at}</Td>
                    <Td>{fmt(p.amount, currency)}</Td>
                    <Td>{p.method}</Td>
                    <Td>{p.reference ?? "—"}</Td>
                  </tr>
                ))}
              </DataTable>
            );
          })()}
        </Panel>
      )}
    </div>
  );
}
