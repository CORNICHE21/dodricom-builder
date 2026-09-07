import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";
import { FINANCE_QUERY_KEY, useFinanceData } from "@/lib/finance-data";
import { PERIODS, periodRange, type PeriodKey, type Range } from "@/lib/finance";
import { scopeSelectors, type Scope } from "@/components/admin/finance/scope";
import { btnCls, inputCls } from "@/components/admin/finance/ui";
import { FinanceDashboard } from "@/components/admin/finance/Dashboard";
import { FinanceTreasury, FinanceAccounts } from "@/components/admin/finance/Treasury";
import { FinanceSales } from "@/components/admin/finance/Sales";
import { FinanceClients } from "@/components/admin/finance/Clients";
import { FinancePurchases } from "@/components/admin/finance/Purchases";
import { FinanceSuppliers } from "@/components/admin/finance/Suppliers";
import { FinanceExpenses } from "@/components/admin/finance/Expenses";
import { FinanceVat } from "@/components/admin/finance/Vat";
import { FinanceAccounting } from "@/components/admin/finance/Accounting";
import { FinanceReports } from "@/components/admin/finance/Reports";
import { FinanceSettingsPanel } from "@/components/admin/finance/Settings";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/finance")({
  component: FinancePage,
});

type TabKey =
  | "dashboard"
  | "treasury"
  | "accounts"
  | "sales"
  | "clients"
  | "purchases"
  | "suppliers"
  | "expenses"
  | "vat"
  | "accounting"
  | "reports"
  | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "treasury", label: "Trésorerie" },
  { key: "accounts", label: "Banques & caisses" },
  { key: "sales", label: "Ventes" },
  { key: "clients", label: "Clients" },
  { key: "purchases", label: "Achats" },
  { key: "suppliers", label: "Fournisseurs" },
  { key: "expenses", label: "Dépenses" },
  { key: "vat", label: "TVA" },
  { key: "accounting", label: "Comptabilité" },
  { key: "reports", label: "Rapports" },
  { key: "settings", label: "Paramètres" },
];

function FinancePage() {
  const { user, can } = useAuth();
  const { data, isLoading, error } = useFinanceData();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [period, setPeriod] = useState<PeriodKey>("year");
  const [custom, setCustom] = useState<Partial<Range>>({});
  const [posId, setPosId] = useState("all");

  const allowed = can("finance");
  const isSuper = !!user?.roles.includes("super_admin");
  const canEdit = allowed && (isSuper || !!user?.roles.some((r) => r === "admin"));
  const canExport = allowed;

  const range = useMemo(() => periodRange(period, custom), [period, custom]);

  const scope: Scope | null = useMemo(
    () => (data ? { data, range, posId } : null),
    [data, range, posId],
  );
  const sel = useMemo(() => (scope ? scopeSelectors(scope) : null), [scope]);

  return (
    <AdminShell title="Finance & Comptabilité" breadcrumbs={[{ label: "Finance" }]}>
      {!allowed ? (
        <div className="glass p-8 text-sm text-white/60">
          Vous n'avez pas accès au module Finance.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass flex flex-wrap items-end gap-3 p-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                Période
              </span>
              <select
                className={inputCls}
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            {period === "custom" && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Du
                  </span>
                  <input
                    type="date"
                    className={inputCls}
                    value={custom.from ?? ""}
                    onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Au
                  </span>
                  <input
                    type="date"
                    className={inputCls}
                    value={custom.to ?? ""}
                    onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                Point de vente
              </span>
              <select className={inputCls} value={posId} onChange={(e) => setPosId(e.target.value)}>
                <option value="all">Tous les points de vente</option>
                {(data?.pos ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className={btnCls}
              onClick={() => qc.invalidateQueries({ queryKey: FINANCE_QUERY_KEY })}
            >
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  tab === t.key
                    ? "bg-[var(--gradient-brand)] text-white shadow-[0_0_20px_rgba(139,61,255,0.35)]"
                    : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="glass flex items-center gap-3 p-8 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des données financières…
            </div>
          )}
          {error && (
            <div className="glass p-6 text-sm text-rose-300">
              Impossible de charger les données financières.
            </div>
          )}

          {scope && sel && (
            <>
              {tab === "dashboard" && <FinanceDashboard scope={scope} sel={sel} />}
              {tab === "treasury" && (
                <FinanceTreasury scope={scope} sel={sel} canEdit={canEdit} />
              )}
              {tab === "accounts" && (
                <FinanceAccounts scope={scope} sel={sel} canEdit={canEdit} />
              )}
              {tab === "sales" && <FinanceSales scope={scope} sel={sel} canExport={canExport} />}
              {tab === "clients" && (
                <FinanceClients scope={scope} sel={sel} canExport={canExport} />
              )}
              {tab === "purchases" && (
                <FinancePurchases scope={scope} sel={sel} canEdit={canEdit} canExport={canExport} />
              )}
              {tab === "suppliers" && <FinanceSuppliers scope={scope} canEdit={canEdit} />}
              {tab === "expenses" && (
                <FinanceExpenses scope={scope} sel={sel} canEdit={canEdit} canExport={canExport} />
              )}
              {tab === "vat" && <FinanceVat scope={scope} sel={sel} canExport={canExport} />}
              {tab === "accounting" && (
                <FinanceAccounting
                  scope={scope}
                  sel={sel}
                  canEdit={canEdit}
                  canExport={canExport}
                />
              )}
              {tab === "reports" && (
                <FinanceReports scope={scope} sel={sel} canExport={canExport} />
              )}
              {tab === "settings" && <FinanceSettingsPanel scope={scope} canEdit={canEdit} />}
            </>
          )}
        </div>
      )}
    </AdminShell>
  );
}
