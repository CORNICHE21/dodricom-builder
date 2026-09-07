import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { DataTable, Empty, fmt, Kpi, Panel, Td } from "./ui";
import type { Scope, Selectors } from "./scope";
import { monthKey, monthLabel, SALES_STATUS_META, todayIso, daysBetween } from "@/lib/finance";
import { Badge } from "./ui";

const COLORS = ["#8B3DFF", "#22D3EE", "#38BDF8", "#F472B6", "#34D399", "#FBBF24", "#F87171"];

const axis = { stroke: "rgba(255,255,255,0.4)", fontSize: 11 };
const tooltipStyle = {
  background: "rgba(10,10,16,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

export function FinanceDashboard({ scope, sel }: { scope: Scope; sel: Selectors }) {
  const { data } = scope;
  const currency = data.settings?.currency ?? "MAD";

  const monthly = useMemo(() => {
    const map = new Map<string, { ca: number; enc: number; dep: number }>();
    const touch = (k: string) => {
      if (!map.has(k)) map.set(k, { ca: 0, enc: 0, dep: 0 });
      return map.get(k)!;
    };
    sel.salesRows.forEach((r) => (touch(monthKey(r.doc.issue_date)).ca += Number(r.doc.total_ht || 0)));
    sel.payments.forEach((p) => (touch(monthKey(p.paid_at)).enc += Number(p.amount || 0)));
    sel.expenses.forEach((e) => (touch(monthKey(e.expense_date)).dep += Number(e.amount_ttc || 0)));
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ mois: monthLabel(k), ...v }));
  }, [sel]);

  const expenseSplit = useMemo(() => {
    const map = new Map<string, number>();
    sel.expenses.forEach((e) => {
      const name = data.expenseCategories.find((c) => c.id === e.category_id)?.name ?? "Autres";
      map.set(name, (map.get(name) ?? 0) + Number(e.amount_ttc || 0));
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [sel, data.expenseCategories]);

  const treasury = useMemo(() => {
    const map = new Map<string, number>();
    sel.transactions.forEach((t) => {
      const sign = ["decaissement", "retrait"].includes(t.tx_type) ? -1 : t.tx_type === "virement" ? 0 : 1;
      const k = monthKey(t.tx_date);
      map.set(k, (map.get(k) ?? 0) + Number(t.amount || 0) * sign);
    });
    let run = 0;
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        run += v;
        return { mois: monthLabel(k), solde: run };
      });
  }, [sel]);

  const latest = useMemo(() => {
    const ops = [
      ...sel.payments.map((p) => ({
        date: p.paid_at,
        type: "Encaissement",
        ref: p.reference ?? "—",
        party: sel.documents.find((d) => d.id === p.document_id)?.client_name ?? "—",
        amount: Number(p.amount || 0),
        method: p.method,
        status: "Encaissé",
      })),
      ...sel.expenses.map((e) => ({
        date: e.expense_date,
        type: "Dépense",
        ref: e.description.slice(0, 30),
        party: data.suppliers.find((s) => s.id === e.supplier_id)?.name ?? "—",
        amount: -Number(e.amount_ttc || 0),
        method: e.payment_method,
        status: "Payée",
      })),
      ...sel.transactions.map((t) => ({
        date: t.tx_date,
        type: "Trésorerie",
        ref: t.reference ?? t.label.slice(0, 30),
        party: t.party_name ?? "—",
        amount: ["decaissement", "retrait"].includes(t.tx_type) ? -Number(t.amount) : Number(t.amount),
        method: t.payment_method,
        status: t.is_reconciled ? "Rapproché" : "À rapprocher",
      })),
    ];
    return ops.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  }, [sel, data.suppliers]);

  const alerts = useMemo(() => {
    const out: { level: "warn" | "danger"; text: string }[] = [];
    const today = todayIso();
    const overdue = sel.allRows.filter((r) => r.overdue);
    if (overdue.length)
      out.push({ level: "danger", text: `${overdue.length} facture(s) échue(s) — ${fmt(overdue.reduce((s, r) => s + r.remaining, 0), currency)}` });
    const soon = sel.allRows.filter(
      (r) => r.remaining > 0 && r.doc.due_date && r.doc.due_date >= today && daysBetween(today, r.doc.due_date) <= 7,
    );
    if (soon.length) out.push({ level: "warn", text: `${soon.length} échéance(s) client dans les 7 jours` });
    const toPay = data.supplierInvoices.filter((i) => i.status !== "paye" && i.status !== "annule");
    if (toPay.length)
      out.push({ level: "warn", text: `${toPay.length} facture(s) fournisseur à payer — ${fmt(toPay.reduce((s, i) => s + Number(i.total_ttc), 0), currency)}` });
    const lowCash = data.settings?.low_cash_threshold ?? 0;
    const lowBank = data.settings?.low_bank_threshold ?? 0;
    if (lowCash && sel.cashBalance < lowCash)
      out.push({ level: "danger", text: `Solde caisse faible : ${fmt(sel.cashBalance, currency)}` });
    if (lowBank && sel.bankBalance < lowBank)
      out.push({ level: "danger", text: `Solde bancaire faible : ${fmt(sel.bankBalance, currency)}` });
    const vatDue = sel.vatCollected - sel.vatDeductible;
    if (vatDue > 0) out.push({ level: "warn", text: `TVA à déclarer : ${fmt(vatDue, currency)}` });
    return out;
  }, [sel, data, currency]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Chiffre d'affaires HT" value={fmt(sel.caHt, currency)} />
        <Kpi label="Chiffre d'affaires TTC" value={fmt(sel.caTtc, currency)} />
        <Kpi label="Encaissements" value={fmt(sel.encaisse, currency)} tone="good" />
        <Kpi label="Créances clients" value={fmt(sel.receivables, currency)} tone="bad" />
        <Kpi label="Dépenses" value={fmt(sel.expenseTtc, currency)} tone="bad" />
        <Kpi label="Dettes fournisseurs" value={fmt(sel.supplierDebt, currency)} tone="bad" />
        <Kpi label="Solde bancaire" value={fmt(sel.bankBalance, currency)} />
        <Kpi label="Solde caisse" value={fmt(sel.cashBalance, currency)} />
        <Kpi
          label="Résultat"
          value={fmt(sel.result, currency)}
          tone={sel.result >= 0 ? "good" : "bad"}
          hint="CA HT − avoirs − achats − dépenses"
        />
      </div>

      {alerts.length > 0 && (
        <Panel title="Centre d'alertes financières">
          <ul className="grid gap-2 sm:grid-cols-2">
            {alerts.map((a, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                  a.level === "danger"
                    ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-200"
                    : "border-amber-400/20 bg-amber-400/[0.06] text-amber-200"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {a.text}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Évolution du chiffre d'affaires">
          {monthly.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B3DFF" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8B3DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mois" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area dataKey="ca" name="CA HT" stroke="#8B3DFF" fill="url(#ca)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Encaissements vs dépenses">
          {monthly.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mois" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="enc" name="Encaissements" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dep" name="Dépenses" fill="#F472B6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Répartition des dépenses">
          {expenseSplit.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseSplit} dataKey="value" nameKey="name" outerRadius={90}>
                  {expenseSplit.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Évolution de la trésorerie">
          {treasury.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={treasury}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mois" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line dataKey="solde" name="Solde cumulé" stroke="#34D399" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Créances clients">
          <DataTable head={["Client", "Reste dû", "Statut"]} empty={!sel.allRows.some((r) => r.remaining > 0)}>
            {sel.allRows
              .filter((r) => r.remaining > 0.005)
              .slice(0, 8)
              .map((r) => (
                <tr key={r.doc.id}>
                  <Td>{r.doc.client_name}</Td>
                  <Td>{fmt(r.remaining, currency)}</Td>
                  <Td>
                    <Badge {...SALES_STATUS_META[r.computedStatus]} />
                  </Td>
                </tr>
              ))}
          </DataTable>
        </Panel>
        <Panel title="Dettes fournisseurs">
          <DataTable
            head={["Fournisseur", "Référence", "TTC"]}
            empty={!data.supplierInvoices.some((i) => i.status !== "paye" && i.status !== "annule")}
          >
            {data.supplierInvoices
              .filter((i) => i.status !== "paye" && i.status !== "annule")
              .slice(0, 8)
              .map((i) => (
                <tr key={i.id}>
                  <Td>{data.suppliers.find((s) => s.id === i.supplier_id)?.name ?? "—"}</Td>
                  <Td>{i.reference}</Td>
                  <Td>{fmt(i.total_ttc, currency)}</Td>
                </tr>
              ))}
          </DataTable>
        </Panel>
      </div>

      <Panel title="Dernières opérations">
        <DataTable
          head={["Date", "Type", "Référence", "Tiers", "Montant", "Mode", "Statut"]}
          empty={latest.length === 0}
        >
          {latest.map((o, i) => (
            <tr key={i}>
              <Td>{o.date}</Td>
              <Td>{o.type}</Td>
              <Td>{o.ref}</Td>
              <Td>{o.party}</Td>
              <Td className={o.amount < 0 ? "text-rose-300" : "text-emerald-300"}>
                {fmt(o.amount, currency)}
              </Td>
              <Td>{o.method}</Td>
              <Td>{o.status}</Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
