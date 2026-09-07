import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth, type ModuleKey } from "@/lib/auth";

interface NavItem {
  key: ModuleKey;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { key: "administration", label: "Administration", to: "/admin/administration", icon: ShieldCheck },
  { key: "cms", label: "Website (CMS)", to: "/admin/cms", icon: Sparkles },
  { key: "crm", label: "Commercial (CRM)", to: "/admin/crm", icon: Users },
  { key: "finance", label: "Finance", to: "/admin/finance", icon: Wallet },
  { key: "billing", label: "Facturation", to: "/admin/billing", icon: FileText },
  { key: "saas", label: "SaaS Management", to: "/admin/saas", icon: Layers },
  { key: "messages", label: "Messages", to: "/admin/messages", icon: MessageSquare },
  { key: "settings", label: "Paramètres", to: "/admin/settings", icon: Settings },
];

export function AdminShell({
  title,
  breadcrumbs = [],
  children,
}: {
  title: string;
  breadcrumbs?: { label: string; to?: string }[];
  children: ReactNode;
}) {
  const { user, ready, logout, can } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05060A] text-white/60">
        Chargement…
      </div>
    );
  }

  const items = NAV.filter((n) => can(n.key));

  return (
    <div className="relative min-h-screen bg-[#05060A] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{ background: "var(--gradient-radial)" }}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-black/60 backdrop-blur-2xl transition-[width,transform] duration-300 ${
          collapsed ? "w-[76px]" : "w-[264px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--gradient-brand)] shadow-[0_0_20px_rgba(139,61,255,0.5)]">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
          </span>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-black tracking-wider text-white">
                DODRI<span className="gradient-text">COM</span>
              </span>
              <span className="mt-1 text-[9px] font-medium tracking-[0.18em] text-white/50">
                BACK OFFICE
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active =
              item.to === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1 left-0 w-[3px] rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div
            className={`flex items-center gap-3 rounded-xl bg-white/[0.03] p-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--gradient-brand)] text-xs font-black">
              {user.username.slice(0, 2)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {user.displayName}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-white/40">
                  {(user.role ?? "guest").replace("_", " ")}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`relative min-h-screen transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-black/50 px-4 backdrop-blur-2xl lg:px-6">
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCollapsed((s) => !s)}
            className="hidden rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label="Réduire le menu"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              placeholder="Rechercher clients, factures, produits…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none transition focus:border-[color:var(--brand-violet)]/50 focus:shadow-[0_0_0_3px_rgba(139,61,255,0.15)]"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[color:var(--brand-violet)] text-[9px] font-bold text-white">
                3
              </span>
            </button>
            <button className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:text-white">
              <CreditCard className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 md:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gradient-brand)] text-[10px] font-black">
                {user.username.slice(0, 2)}
              </span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-semibold text-white">
                  {user.displayName.split(" ")[0]}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-white/50">
                  {(user.role ?? "guest").replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="relative px-4 py-6 lg:px-8 lg:py-10">
          <div className="mb-6">
            <nav
              aria-label="Breadcrumb"
              className="mb-3 flex items-center gap-1.5 text-xs text-white/50"
            >
              <Link to="/admin" className="hover:text-white">
                Back Office
              </Link>
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3" />
                  {b.to ? (
                    <Link to={b.to} className="hover:text-white">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-white/70">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
              {title}
            </h1>
          </div>
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="glass relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {delta && (
            <p
              className={`mt-1 text-xs font-semibold ${
                positive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {delta} vs mois dernier
            </p>
          )}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06]">
          <Icon className="h-5 w-5 text-white/80" />
        </span>
      </div>
    </div>
  );
}

export function Placeholder({
  description,
  bullets,
}: {
  description: string;
  bullets: string[];
}) {
  return (
    <div className="glass p-8">
      <p className="text-white/70">{description}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-violet)]" />
            {b}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-white/40">
        Module opérationnel — connectez Lovable Cloud pour brancher les données live.
      </p>
    </div>
  );
}