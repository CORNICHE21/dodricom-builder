import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useT, Txt, useCmsImage } from "@/lib/site-text-context";
import heroPortfolio from "@/assets/hero-portfolio.jpg";
import { getProjects } from "@/lib/content.functions";
import { categoryImage } from "@/lib/content-images";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => getProjects(),
});

export const Route = createFileRoute("/realisations")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(projectsQuery);
  },
  component: RealisationsPage,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div role="alert" className="mx-auto max-w-3xl px-5 py-32 text-white/80">
        Impossible de charger les réalisations : {error.message}
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-32 text-white/80">Aucune réalisation publiée.</div>
    </SiteLayout>
  ),
  head: () => ({
    meta: [
      { title: "Réalisations — DODRICOM" },
      { name: "description", content: "Découvrez une sélection de projets réalisés par DODRICOM." },
      { property: "og:title", content: "Réalisations — DODRICOM" },
      { property: "og:description", content: "Projets sur mesure en domotique, digital, réseaux, IA, communication et événementiel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RealisationsPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const t = useT("realisations");
  const headerBg = useCmsImage("realisations", "header.bg", heroPortfolio);
  const allLabel = t("filter.all");
  const [filter, setFilter] = useState("__all__");

  const filters = [
    "__all__",
    ...Array.from(new Set(projects.map((p) => p.categoryName).filter((n): n is string => !!n))),
  ];
  const filtered = filter === "__all__" ? projects : projects.filter((p) => p.categoryName === filter);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("hero.eyebrow")}
        title={<><Txt page="realisations" k="hero.title1" /> <span className="gradient-text"><Txt page="realisations" k="hero.title2" /></span></>}
        subtitle={t("hero.subtitle")}
        bgImage={headerBg}
        bgAlt="Portfolio DODRICOM — mur de projets illuminé"
      />

      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="glass-strong flex flex-wrap items-center gap-2 p-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? "bg-[var(--gradient-primary)] text-white shadow-[0_0_20px_rgba(139,61,255,0.5)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f === "__all__" ? allLabel : f}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <article key={p.id} className="glass card-hover group relative overflow-hidden p-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
                <img
                  src={categoryImage(p.categorySlug ?? "", p.coverImageUrl)}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />
                {p.categoryName && (
                  <span className="absolute left-4 top-4 rounded-full bg-[var(--gradient-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(139,61,255,0.5)]">
                    {p.categoryName}
                  </span>
                )}
                <div className="absolute inset-0 bg-[color:var(--brand-violet)]/0 transition-colors duration-500 group-hover:bg-[color:var(--brand-violet)]/20" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/70">{p.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                  <Txt page="realisations" k="card.cta" /> <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="glass flex flex-col items-start justify-between gap-6 p-8 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-2xl font-black text-white sm:text-3xl"><Txt page="realisations" k="cta.title" /></h3>
            <p className="mt-2 text-white/70"><Txt page="realisations" k="cta.body" /></p>
          </div>
          <Link to="/contact" className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            <Txt page="realisations" k="cta.button" /> <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
