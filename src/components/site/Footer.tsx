import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-black/60">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:var(--gradient-radial)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[color:var(--brand-text-muted)]">
              L'innovation au service de votre performance. Solutions premium en Domotique,
              Digital, Réseaux, IA, COM et Événementiel.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-[color:var(--brand-violet)] hover:text-white hover:shadow-[0_0_20px_rgba(139,61,255,0.5)]"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {[
                ["/", "Accueil"],
                ["/a-propos", "À propos"],
                ["/services", "Services"],
                ["/realisations", "Réalisations"],
                ["/saas", "SaaS"],
                ["/blog", "Blog"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Services</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {["Domotique", "Digital", "Réseaux", "IA", "COM", "Events"].map(
                (s) => (
                  <li key={s}>
                    <Link to="/services" className="transition hover:text-white">
                      {s}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--brand-violet)]" />
                <span>Casablanca, Maroc</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-[color:var(--brand-violet)]" />
                <span>+212 5 22 00 00 00</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[color:var(--brand-violet)]" />
                <span>contact@dodricom.com</span>
              </li>
            </ul>

            <form className="mt-6 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="Votre email"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--brand-violet)] focus:outline-none"
              />
              <button className="btn-gradient rounded-full px-4 py-2 text-sm font-semibold">OK</button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} DODRICOM. Tous droits réservés.</p>
          <p>Domotique · Digital · Réseaux · IA · COM · Events</p>
        </div>
      </div>
    </footer>
  );
}