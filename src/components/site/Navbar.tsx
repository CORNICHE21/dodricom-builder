import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LoginModal } from "./LoginModal";
import { useAuth } from "@/lib/auth";
import { useSiteConfig } from "@/lib/site-text-context";

const ALL_NAV = [
  { to: "/", slug: "accueil", label: "Accueil" },
  { to: "/a-propos", slug: "a-propos", label: "À propos" },
  { to: "/services", slug: "services", label: "Nos services" },
  { to: "/realisations", slug: "realisations", label: "Réalisations" },
  { to: "/blog", slug: "blog", label: "Blog" },
  { to: "/contact", slug: "contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useAuth();
  const { pageVisibility } = useSiteConfig();
  const NAV = useMemo(
    () => ALL_NAV.filter((i) => pageVisibility[i.slug] !== false || Boolean(user)),
    [pageVisibility, user],
  );


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-black/60 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 lg:h-[90px] lg:px-8">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white"
                activeProps={{ className: "text-white" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-[var(--gradient-primary)] transition-all duration-300 ${
                        isActive
                          ? "opacity-100 shadow-[0_0_12px_rgba(139,61,255,0.9)]"
                          : "opacity-0 group-hover:opacity-70"
                      }`}
                    />
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link
              to="/admin"
              className="group relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:shadow-[0_0_25px_rgba(139,61,255,0.4)]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gradient-brand)] text-[10px] font-black text-white">
                {user.username.slice(0, 1)}
              </span>
              Back Office
            </Link>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="group relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:shadow-[0_0_25px_rgba(139,61,255,0.4)]"
            >
              <LogIn className="h-4 w-4 opacity-80 transition group-hover:opacity-100" />
              Connexion
            </button>
          )}
          <Link
            to="/contact"
            className="btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Demander un devis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          className="lg:hidden rounded-full p-2 text-white/80 hover:text-white"
          onClick={() => setOpen((s) => !s)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-white/5 bg-black/85 backdrop-blur-2xl">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
                  activeProps={{ className: "bg-white/5 text-white" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="btn-gradient flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Demander un devis <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
            <li>
              {user ? (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="btn-ghost-glow flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Ouvrir le Back Office
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    setLoginOpen(true);
                  }}
                  className="btn-ghost-glow flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <LogIn className="h-4 w-4" /> Connexion
                </button>
              )}
            </li>
          </ul>
        </div>
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}