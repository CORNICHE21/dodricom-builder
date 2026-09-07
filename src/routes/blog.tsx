import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Clock, Search, ArrowRight } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useT, Txt } from "@/lib/site-text-context";
import { getBlogPosts } from "@/lib/content.functions";
import { CATEGORY_IMAGES } from "@/lib/content-images";
import imgDigital from "@/assets/service-digital.jpg";

const postsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: () => getBlogPosts(),
});

export const Route = createFileRoute("/blog")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(postsQuery);
  },
  component: BlogPage,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div role="alert" className="mx-auto max-w-3xl px-5 py-32 text-white/80">
        Impossible de charger les articles : {error.message}
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-32 text-white/80">Aucun article publié.</div>
    </SiteLayout>
  ),
  head: () => ({
    meta: [
      { title: "Blog — DODRICOM" },
      { name: "description", content: "Actualités, tendances et conseils sur la technologie, la domotique, l'IA et le digital." },
      { property: "og:title", content: "Blog — DODRICOM" },
      { property: "og:description", content: "Décryptages et bonnes pratiques tech par l'équipe DODRICOM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function postImage(category: string | null, url: string | null) {
  if (url) return url;
  const key = (category ?? "").toLowerCase();
  return CATEGORY_IMAGES[key] ?? imgDigital;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

function BlogPage() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  const t = useT("blog");

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("hero.eyebrow")}
        title={<><Txt page="blog" k="hero.title1" /> <span className="gradient-text"><Txt page="blog" k="hero.title2" /></span></>}
        subtitle={t("hero.subtitle")}
      />

      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="glass flex items-center gap-3 px-5 py-3">
          <Search className="h-4 w-4 text-white/60" />
          <input
            type="search"
            placeholder={t("search.placeholder")}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        {posts.length === 0 ? (
          <p className="glass p-8 text-sm text-white/60"><Txt page="blog" k="empty" /></p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article key={p.id} className="glass card-hover group overflow-hidden p-0">
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl">
                  <img
                    src={postImage(p.category, p.coverImageUrl)}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {p.category && (
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--gradient-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(p.publishedAt)}
                    </span>
                    {p.readMinutes && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.readMinutes} min
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-white">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-white/65">{p.excerpt}</p>}
                  {p.authorName && <p className="mt-2 text-xs text-white/60">Par {p.authorName}</p>}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                    <Txt page="blog" k="card.cta" /> <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
