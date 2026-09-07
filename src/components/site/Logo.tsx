import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group flex shrink-0 items-center gap-2.5 ${className}`}
      aria-label="DODRICOM — Accueil"
    >
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.6)] transition-transform duration-300 group-hover:scale-105 xl:h-11 xl:w-11">
        <span className="absolute inset-1 rounded-full border border-white/30" />
        <span className="absolute inset-2.5 rounded-full border border-white/60" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display whitespace-nowrap text-lg font-black text-white xl:text-xl">
          DODRI<span className="gradient-text">COM</span>
        </span>
        <span className="mt-1 hidden whitespace-nowrap text-[9px] font-medium text-[color:var(--brand-text-muted)] 2xl:block">
          DOMOTIQUE · DIGITAL · RÉSEAUX · IA
        </span>
      </span>
    </Link>
  );
}
