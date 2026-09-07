import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group flex items-center gap-3 ${className}`}
      aria-label="DODRICOM — Accueil"
    >
      <span className="relative grid h-11 w-11 place-items-center rounded-full bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.6)] transition-transform duration-300 group-hover:scale-105">
        <span className="absolute inset-1 rounded-full border border-white/30" />
        <span className="absolute inset-2.5 rounded-full border border-white/60" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-black tracking-wider text-white">
          DODRI<span className="gradient-text">COM</span>
        </span>
        <span className="mt-1 hidden text-[9px] font-medium tracking-[0.18em] text-[color:var(--brand-text-muted)] sm:block">
          DOMOTIQUE · DIGITAL · RÉSEAUX · IA
        </span>
      </span>
    </Link>
  );
}
