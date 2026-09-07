import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  Cpu,
  Home,
  Megaphone,
  Network,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CinematicHero } from "@/components/site/CinematicHero";
import { useT, Txt } from "@/lib/site-text-context";
import aboutReception from "@/assets/about-reception.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "DODRICOM — Entrez dans le siège de l'innovation" },
      {
        name: "description",
        content:
          "Vivez une expérience cinématique : entrez dans le siège DODRICOM et découvrez nos solutions premium en Domotique, Digital, Réseaux, IA, COM et Événementiel.",
      },
      { property: "og:title", content: "DODRICOM — Entrez dans le siège de l'innovation" },
      { property: "og:description", content: "Vivez une expérience cinématique : entrez dans le siège DODRICOM et découvrez nos solutions premium en Domotique, Digital, Réseaux, IA, COM et Événementiel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SERVICES = [
  { key: "domotique", label: "Domotique", icon: Home, desc: "Habitats connectés, confortables et sécurisés." },
  { key: "digital", label: "Digital", icon: Cpu, desc: "Sites web, e-commerce et outils sur mesure." },
  { key: "reseaux", label: "Réseaux", icon: Network, desc: "Infrastructures performantes et sécurisées." },
  { key: "ia", label: "IA", icon: BrainCircuit, desc: "Automatisation et IA." },
  { key: "communication", label: "COM", icon: Megaphone, desc: "Branding, contenu et audiovisuel." },
  { key: "events", label: "Events", icon: Calendar, desc: "Événements clés en main, sans compromis." },
];

function HomePage() {
  const t = useT("accueil");
  return (
    <SiteLayout>
      {/* HERO — cinematic scroll into the DODRICOM headquarters */}
      <div className="-mt-[78px] lg:-mt-[90px]">
        <CinematicHero />
      </div>

      {/* SERVICES GRID */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
              <Txt page="accueil" k="services.eyebrow" />
            </p>
            <h2 className="max-w-3xl text-[2.75rem] font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              <Txt page="accueil" k="services.title" />
            </h2>
          </div>
          <Link
            to="/services"
            className="btn-ghost-glow inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            <Txt page="accueil" k="services.cta" /> <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, label, icon: Icon, desc }) => (
            <Link
              to="/services"
              key={key}
              className="glass card-hover group relative overflow-hidden p-7"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color:var(--brand-violet)]/20 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
              <div className="relative">
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-primary)] shadow-[0_0_30px_rgba(139,61,255,0.4)]">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm text-white/70">{desc}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                  Explorer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="glass grid gap-10 overflow-hidden p-6 lg:grid-cols-2 lg:p-4">
          <div className="relative min-h-[380px] overflow-hidden rounded-3xl">
            <img
              src={aboutReception}
              alt="Réception moderne DODRICOM"
              width={1600}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--brand-violet)]/30 via-transparent to-[color:var(--brand-blue)]/20" />
          </div>
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
              <Txt page="accueil" k="about.eyebrow" />
            </p>
            <h2 className="text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              <Txt page="accueil" k="about.title" />
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/70 lg:text-lg">
              <Txt page="accueil" k="about.body" />
            </p>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-white/80 lg:text-base">
              {[
                t("about.bullet1"),
                t("about.bullet2"),
                t("about.bullet3"),
                t("about.bullet4"),
              ].filter(Boolean).map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[var(--gradient-primary)] shadow-[0_0_10px_rgba(139,61,255,0.8)]" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/a-propos"
                className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                <Txt page="accueil" k="about.cta" /> <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-10 lg:p-16">
          <div className="absolute inset-0 [background:var(--gradient-brand)] opacity-90" />
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
                <Txt page="accueil" k="cta.title" />
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85 lg:text-lg">
                <Txt page="accueil" k="cta.body" />
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-semibold text-white shadow-2xl transition hover:bg-black/85"
            >
              <Txt page="accueil" k="cta.button" /> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}