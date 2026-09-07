import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Home,
  Leaf,
  Megaphone,
  Network,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useT, Txt } from "@/lib/site-text-context";
import { getServicesContent } from "@/lib/content.functions";
import { categoryImage, productImage } from "@/lib/content-images";

const servicesQuery = queryOptions({
  queryKey: ["services-content"],
  queryFn: () => getServicesContent(),
});

export const Route = createFileRoute("/services")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(servicesQuery);
  },
  component: ServicesPage,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div role="alert" className="mx-auto max-w-3xl px-5 py-32 text-white/80">
        Impossible de charger les services : {error.message}
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-32 text-white/80">Aucun service publié.</div>
    </SiteLayout>
  ),
  head: () => ({
    meta: [
      { title: "Nos services — DODRICOM" },
      { name: "description", content: "Domotique, Digital, Réseaux, IA, COM et Événementiel : découvrez nos solutions premium." },
      { property: "og:title", content: "Nos services — DODRICOM" },
      { property: "og:description", content: "Solutions premium en domotique, digital, réseaux, IA, COM et événementiel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const ICONS: Record<string, typeof Home> = {
  domotique: Home,
  digital: Cpu,
  reseaux: Network,
  ia: BrainCircuit,
  communication: Megaphone,
  events: Calendar,
};

const BENEFIT_ICONS = [Rocket, Zap, Shield, Leaf];

function formatPrice(price: number | null, currency: string, period?: string | null) {
  if (price === null) return "Sur devis";
  const unit = currency === "MAD" ? "DH" : currency;
  const formatted = new Intl.NumberFormat("fr-FR").format(price);
  return period ? `${formatted} ${unit} /${period}` : `${formatted} ${unit}`;
}

function ServicesPage() {
  const { data } = useSuspenseQuery(servicesQuery);
  const t = useT("services");
  const { categories, products, packages } = data;
  const BENEFITS = BENEFIT_ICONS.map((icon, i) => ({
    icon,
    title: t(`benefit.${i + 1}.title`),
    desc: t(`benefit.${i + 1}.desc`),
  }));
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const category = categories.find((c) => c.slug === active) ?? categories[0];
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (!category) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-5 py-32 text-white/70">Aucun service publié pour le moment.</div>
      </SiteLayout>
    );
  }

  const Icon = ICONS[category.slug] ?? Cpu;
  const catProducts = products.filter((p) => p.categorySlug === category.slug);
  const catPacks = packages.filter((p) => p.categorySlug === category.slug);

  return (
    <SiteLayout>
      {/* HERO WITH TABS */}
      <section key={category.slug} className="relative -mt-[78px] overflow-hidden pb-14 lg:-mt-[90px]">
        <img
          src={categoryImage(category.slug, category.imageUrl)}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/85 to-[#05060A]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 pt-32 lg:px-8 lg:pt-40">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
                <Txt page="services" k="hero.eyebrow" />
              </p>
              <h1 className="text-5xl font-black uppercase leading-none text-white sm:text-6xl">
                {category.name}
              </h1>
              <p className="mt-5 max-w-sm text-sm text-white/75">
                {category.description ?? category.tagline}
              </p>
            </div>

            <div className="glass-strong flex items-center justify-between gap-1 rounded-3xl p-2">
              {categories.map((c) => {
                const CIcon = ICONS[c.slug] ?? Cpu;
                const isActive = c.slug === category.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => setActive(c.slug)}
                    className={`group relative flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-[10px] font-bold uppercase tracking-wider transition ${
                      isActive ? "text-white" : "text-white/55 hover:text-white/85"
                    }`}
                  >
                    <CIcon
                      className={`h-6 w-6 ${
                        isActive
                          ? "text-[color:var(--brand-violet)] drop-shadow-[0_0_10px_rgba(139,61,255,0.9)]"
                          : ""
                      }`}
                    />
                    <span>{c.name}</span>
                    {isActive && (
                      <span className="mt-1 h-0.5 w-6 rounded-full bg-[var(--gradient-primary)] shadow-[0_0_10px_rgba(139,61,255,0.9)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS — Apple-store style cards */}
      <section className="relative mx-auto max-w-7xl px-5 pb-10 lg:px-8">
        <div className="mb-5 flex items-end justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] gradient-text"><Txt page="services" k="products.title" /></p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Précédent"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Suivant"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {catProducts.length === 0 ? (
          <p className="glass p-8 text-sm text-white/60">
            <Txt page="services" k="products.empty" />
          </p>
        ) : (
          <div
            ref={scroller}
            className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {catProducts.map((p) => (
              <article
                key={p.id}
                className="glass card-hover group w-[290px] shrink-0 snap-start overflow-hidden p-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-t-3xl bg-black">
                  <img
                    src={productImage(p.slug, p.imageUrl, p.categorySlug)}
                    alt={p.name}
                    width={800}
                    height={800}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />
                  {p.badge && (
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--gradient-primary)] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(139,61,255,0.5)]">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/65">
                    {p.tagline ?? p.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xl font-black gradient-text">
                      {formatPrice(p.price, p.currency)}
                    </p>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 transition group-hover:text-white"
                    >
                      <Txt page="services" k="products.cta" /> <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-[var(--gradient-primary)]" />
          </div>
          <span className="ml-4">{catProducts.length} produits</span>
        </div>
      </section>

      {/* PACKS + BENEFITS */}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
          <Txt page="services" k="packs.title" /> {category.name.toLowerCase()}
        </p>
        <div className="grid gap-5 lg:grid-cols-4">
          {catPacks.map((pack) => (
            <div
              key={pack.id}
              className={`glass relative p-6 ${
                pack.isPopular
                  ? "border-[color:var(--brand-violet)]/60 shadow-[0_0_40px_rgba(139,61,255,0.35)]"
                  : ""
              }`}
            >
              {pack.isPopular && (
                <span className="absolute right-4 top-4 rounded-full bg-[var(--gradient-primary)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Populaire
                </span>
              )}
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)] shadow-[0_0_20px_rgba(139,61,255,0.4)]">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">{pack.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black gradient-text">
                  {formatPrice(pack.price, pack.currency, pack.billingPeriod)}
                </span>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-white/80">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-violet)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="btn-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold"
              >
                {pack.ctaLabel ?? t("packs.cta")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}

          <div className="glass p-6">
            <ul className="space-y-5">
              {BENEFITS.map(({ icon: BIcon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color:var(--brand-violet)]/40 bg-[color:var(--brand-violet)]/10">
                    <BIcon className="h-4 w-4 text-[color:var(--brand-violet)]" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white">{title}</h4>
                    <p className="text-xs text-white/60">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center text-white/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em]"><Txt page="services" k="scroll.hint" /></p>
          <ChevronDown className="mt-2 h-5 w-5 animate-bounce" />
        </div>
      </section>
    </SiteLayout>
  );
}
