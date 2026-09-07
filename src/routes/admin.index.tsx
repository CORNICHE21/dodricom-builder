import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  DollarSign,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { getOpsStats, getVisitorStats } from "@/lib/analytics.functions";
import { money } from "@/lib/billing";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const COLORS = ["#8B3DFF", "#5A50FF", "#2979FF", "#39D5FF", "#B47CFF", "#7C5CFF", "#3FE0C5", "#FF7CD1"];

const tooltipStyle = {
  background: "rgba(10,10,25,0.9)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "white",
};

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
}

function DashboardPage() {
  const visitorsFn = useServerFn(getVisitorStats);
  const opsFn = useServerFn(getOpsStats);

  const visitors = useQuery({
    queryKey: ["admin", "visitors"],
    queryFn: () => visitorsFn(),
    refetchInterval: 60000,
  });
  const ops = useQuery({ queryKey: ["admin", "ops"], queryFn: () => opsFn() });

  const v = visitors.data;
  const o = ops.data;
  const loading = visitors.isLoading || ops.isLoading;

  return (
    <AdminShell title="Tableau de bord" breadcrumbs={[{ label: "Dashboard" }]}>
      {loading && (
        <div className="glass mb-4 flex items-center gap-3 p-5 text-sm text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement des indicateurs…
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard label="Visiteurs en ligne" value={String(v?.online ?? 0)} icon={Activity} />
        <StatCard label="Visites ce mois" value={String(v?.month ?? 0)} icon={Users} />
        <StatCard label="Visites cette année" value={String(v?.year ?? 0)} icon={Globe} />
        <StatCard label="Visites aujourd'hui" value={String(v?.today ?? 0)} icon={Activity} />
      </motion.div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Facturé (TTC)" value={money(o?.caTtc ?? 0)} icon={DollarSign} />
        <StatCard label="Encaissé" value={money(o?.encaisse ?? 0)} icon={Wallet} />
        <StatCard label="Restant dû" value={money(o?.restant ?? 0)} icon={FileText} />
        <StatCard label="Achats (TTC)" value={money(o?.achatsTtc ?? 0)} icon={ShoppingBag} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents émis" value={String(o?.docs ?? 0)} icon={FileText} />
        <StatCard label="Devis" value={String(o?.devis ?? 0)} icon={FileText} />
        <StatCard label="Commandes nouvelles" value={String(o?.commandesNouvelles ?? 0)} icon={ShoppingBag} />
        <StatCard label="Messages non lus" value={String(o?.messagesNouveaux ?? 0)} icon={MessageSquare} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="glass p-6 xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Fréquentation — 30 derniers jours</h2>
            <p className="text-xs text-white/50">Visites et visiteurs uniques</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={v?.byDay ?? []}>
                <defs>
                  <linearGradient id="vis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B3DFF" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8B3DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="uni" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2979FF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2979FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="visiteurs" stroke="#2979FF" strokeWidth={2} fill="url(#uni)" />
                <Area type="monotone" dataKey="visites" stroke="#8B3DFF" strokeWidth={2.5} fill="url(#vis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Pays des visiteurs</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={v?.byCountry ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(v?.byCountry ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="glass p-6 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-white">Fréquentation par mois — 12 derniers mois</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={v?.byMonth ?? []}>
                <defs>
                  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B3DFF" />
                    <stop offset="100%" stopColor="#2979FF" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="visites" fill="url(#bar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-3 text-sm font-semibold text-white">Visiteurs en direct</h2>
          {(v?.live.length ?? 0) === 0 ? (
            <p className="text-xs text-white/40">Personne sur le site en ce moment.</p>
          ) : (
            <ul className="space-y-3">
              {v?.live.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-white/85">{l.path}</span>
                  <span className="shrink-0 text-[11px] text-white/40">
                    {[l.city, l.country].filter(Boolean).join(", ") || "—"} · {timeAgo(l.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-6 mb-3 text-sm font-semibold text-white">Pages les plus vues</h2>
          <ul className="space-y-2">
            {(v?.topPages ?? []).map((p) => (
              <li key={p.path} className="flex items-center justify-between text-sm text-white/80">
                <span className="truncate">{p.path}</span>
                <span className="text-white/40">{p.value}</span>
              </li>
            ))}
            {(v?.topPages.length ?? 0) === 0 && <li className="text-xs text-white/40">Aucune donnée pour l'instant.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="glass p-6 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-white">Chiffre d'affaires et encaissements — 12 mois</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={o?.caByMonth ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="ca" stroke="#8B3DFF" strokeWidth={2.5} fill="url(#vis)" />
                <Area type="monotone" dataKey="encaisse" stroke="#3FE0C5" strokeWidth={2} fill="url(#uni)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Activité récente</h2>
          {(o?.recent.length ?? 0) === 0 ? (
            <p className="text-xs text-white/40">Aucune activité pour l'instant.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-white/10 pl-4">
              {o?.recent.map((a, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[22px] top-1 grid h-6 w-6 place-items-center rounded-full border border-white/10 ${
                      a.tone === "blue"
                        ? "bg-blue-500/20 text-blue-300"
                        : a.tone === "cyan"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-violet-500/20 text-violet-300"
                    }`}
                  >
                    <Activity className="h-3 w-3" />
                  </span>
                  <p className="text-sm text-white/85">{a.label}</p>
                  <p className="text-[11px] text-white/40">
                    {a.sub} · {timeAgo(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
