import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  FileText,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
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

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const revenueData = [
  { m: "Jan", revenue: 42, target: 38 },
  { m: "Fév", revenue: 51, target: 42 },
  { m: "Mar", revenue: 48, target: 46 },
  { m: "Avr", revenue: 63, target: 50 },
  { m: "Mai", revenue: 72, target: 55 },
  { m: "Juin", revenue: 68, target: 58 },
  { m: "Juil", revenue: 84, target: 62 },
  { m: "Août", revenue: 91, target: 66 },
  { m: "Sep", revenue: 102, target: 70 },
  { m: "Oct", revenue: 118, target: 76 },
  { m: "Nov", revenue: 129, target: 82 },
  { m: "Déc", revenue: 148, target: 90 },
];

const salesData = [
  { d: "Lun", value: 24 },
  { d: "Mar", value: 31 },
  { d: "Mer", value: 28 },
  { d: "Jeu", value: 42 },
  { d: "Ven", value: 58 },
  { d: "Sam", value: 36 },
  { d: "Dim", value: 19 },
];

const segments = [
  { name: "Domotique", value: 32 },
  { name: "Digital", value: 26 },
  { name: "Réseaux", value: 18 },
  { name: "IA", value: 14 },
  { name: "Events", value: 10 },
];
const COLORS = ["#8B3DFF", "#5A50FF", "#2979FF", "#39D5FF", "#B47CFF"];

const activity = [
  { icon: UserPlus, text: "Nouveau lead — SAS Meridian", time: "il y a 4 min", tone: "violet" },
  { icon: FileText, text: "Devis #2841 accepté (24 800 €)", time: "il y a 22 min", tone: "emerald" },
  { icon: ShoppingBag, text: "Commande #1908 expédiée", time: "il y a 1 h", tone: "blue" },
  { icon: DollarSign, text: "Paiement reçu — 12 400 €", time: "il y a 3 h", tone: "emerald" },
  { icon: Activity, text: "Nouveau ticket support #482", time: "il y a 5 h", tone: "cyan" },
];

function DashboardPage() {
  return (
    <AdminShell title="Tableau de bord" breadcrumbs={[{ label: "Dashboard" }]}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard label="Revenu (MTD)" value="148 320 €" delta="+18.4%" icon={DollarSign} />
        <StatCard label="Nouveaux clients" value="284" delta="+12.1%" icon={Users} />
        <StatCard label="Taux de conversion" value="4.82%" delta="+0.6%" icon={TrendingUp} />
        <StatCard label="Factures en attente" value="12" delta="-3.0%" icon={FileText} />
      </motion.div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="glass xl:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenu vs objectif</h2>
              <p className="text-xs text-white/50">12 derniers mois — en k€</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/70">
              +42% YoY
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B3DFF" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8B3DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2979FF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2979FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="m" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,10,25,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Area type="monotone" dataKey="target" stroke="#2979FF" strokeWidth={2} fill="url(#tar)" />
                <Area type="monotone" dataKey="revenue" stroke="#8B3DFF" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Répartition par pôle</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {segments.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,10,25,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="glass xl:col-span-2 p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Ventes hebdomadaires</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <defs>
                  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B3DFF" />
                    <stop offset="100%" stopColor="#2979FF" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "rgba(10,10,25,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Bar dataKey="value" fill="url(#bar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Activité récente</h2>
          <ol className="relative space-y-4 border-l border-white/10 pl-4">
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[22px] top-1 grid h-6 w-6 place-items-center rounded-full border border-white/10 ${
                      a.tone === "emerald"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : a.tone === "blue"
                        ? "bg-blue-500/20 text-blue-300"
                        : a.tone === "cyan"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-violet-500/20 text-violet-300"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <p className="text-sm text-white/85">{a.text}</p>
                  <p className="text-[11px] text-white/40">{a.time}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </AdminShell>
  );
}