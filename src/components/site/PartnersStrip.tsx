import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


export type PartnerItem = { id: string; name: string; logoUrl: string | null; websiteUrl: string | null };

export function usePartners() {
  return useQuery({
    queryKey: ["partners-public"],
    queryFn: async (): Promise<PartnerItem[]> => {
      const { data } = await supabase
        .from("partners")
        .select("id, name, logo_url, website_url, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        logoUrl: p.logo_url,
        websiteUrl: p.website_url,
      }));
    },
    staleTime: 30_000,
  });
}

/**
 * Bande horizontale de logos partenaires : fond noir, logos monochromes,
 * défilement fluide et continu (pause au survol), piloté par le CMS.
 */
export function PartnersStrip({ className = "" }: { className?: string }) {
  const { data } = usePartners();
  const partners = data ?? [];
  if (partners.length === 0) return null;
  const items = [...partners, ...partners];

  return (
    <section aria-label="Nos partenaires" className={`pointer-events-auto w-full  ${className}`}>
      <div>
        <div className="logo-marquee mx-auto max-w-[1400px] px-4 py-6 sm:py-8">
          <div className="logo-marquee-track flex w-max items-center gap-14 sm:gap-20">
            {items.map((p, i) => (
              <a
                key={`${p.id}-${i}`}
                href={p.websiteUrl ?? undefined}
                target={p.websiteUrl ? "_blank" : undefined}
                rel="noreferrer"
                aria-hidden={i >= partners.length ? true : undefined}
                tabIndex={i >= partners.length ? -1 : undefined}
                className="flex shrink-0 items-center opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                aria-label={p.name}
              >
                {p.logoUrl ? (
                  <img
                    src={p.logoUrl}
                    alt={`Logo ${p.name}`}
                    loading="lazy"
                    className="h-8 w-auto max-w-[160px] object-contain brightness-0 invert sm:h-10"
                  />
                ) : (
                  <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em] text-white/85 sm:text-base">
                    {p.name}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
