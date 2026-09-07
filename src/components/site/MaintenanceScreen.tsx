import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { LoginModal } from "./LoginModal";
import { useSiteConfig } from "@/lib/site-text-context";

function useCountdown(targetAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = targetAt ? new Date(targetAt).getTime() : 0;
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function Box({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[86px] flex-col items-center rounded-2xl border border-white/10 bg-black/60 px-5 py-4 backdrop-blur-xl sm:min-w-[120px] sm:px-7 sm:py-6">
      <span className="text-3xl font-black tabular-nums text-white sm:text-5xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

/** Écran de maintenance plein écran : logo, compte à rebours et accès Connexion. */
export function MaintenanceScreen() {
  const { maintenance } = useSiteConfig();
  const [loginOpen, setLoginOpen] = useState(false);
  const c = useCountdown(maintenance.targetAt);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060A]">
      {maintenance.backgroundUrl && (
        <img
          src={maintenance.backgroundUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-60 blur-[2px]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />

      <header className="relative z-20 flex justify-end px-5 py-5 lg:px-10">
        <button
          onClick={() => setLoginOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60"
        >
          <LogIn className="h-4 w-4 opacity-80" /> Connexion
        </button>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-84px)] max-w-4xl flex-col items-center justify-center px-5 pb-16 text-center">
        {maintenance.logoUrl && (
          <img
            src={maintenance.logoUrl}
            alt="Logo"
            className="mb-8 w-auto object-contain"
            style={{ height: `${maintenance.logoSize || 72}px` }}
          />
        )}
        <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">{maintenance.title}</h1>
        {maintenance.subtitle && <p className="mt-4 max-w-xl text-base text-white/70">{maintenance.subtitle}</p>}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <Box value={c.days} label="Days" />
          <Box value={c.hours} label="Hours" />
          <Box value={c.minutes} label="Minutes" />
          <Box value={c.seconds} label="Seconds" />
        </div>
      </main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
