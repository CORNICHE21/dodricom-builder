import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSiteContent } from "./site-text.functions";
import { TEXT_DEFAULTS, TYPOGRAPHY_DEFAULT, type TextStyle, type Typography } from "./site-text";
import {
  MAINTENANCE_DEFAULT,
  type CustomButton,
  type CustomButtonMap,
  type MaintenanceConfig,
  type PageVisibility,
} from "./site-config";

export const siteTextsQuery = queryOptions({
  queryKey: ["site-texts"],
  queryFn: () => getSiteContent(),
  staleTime: 30_000,
});

type Ctx = {
  texts: Record<string, string>;
  styles: Record<string, TextStyle>;
  images: Record<string, string>;
  typography: Typography;
  maintenance: MaintenanceConfig;
  pageVisibility: PageVisibility;
  buttons: CustomButtonMap;
};

const SiteTextContext = createContext<Ctx>({
  texts: TEXT_DEFAULTS,
  styles: {},
  images: {},
  typography: TYPOGRAPHY_DEFAULT,
  maintenance: MAINTENANCE_DEFAULT,
  pageVisibility: {},
  buttons: {},
});


export function styleToCss(s: TextStyle | undefined): CSSProperties {
  if (!s) return {};
  const css: CSSProperties = {};
  if (s.font) css.fontFamily = `var(--font-${s.font})`;
  if (s.size) css.fontSize = s.size;
  if (s.weight) css.fontWeight = s.weight as CSSProperties["fontWeight"];
  if (s.color) css.color = s.color;
  if (s.align) { css.textAlign = s.align; css.display = "block"; }
  if (s.transform) css.textTransform = s.transform;
  if (s.letterSpacing) css.letterSpacing = s.letterSpacing;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.offsetX || s.offsetY) {
    css.display = "inline-block";
    css.transform = `translate(${s.offsetX || "0px"}, ${s.offsetY || "0px"})`;
  }
  return css;
}

export function SiteTextProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(siteTextsQuery);

  const value = useMemo<Ctx>(() => {
    const texts: Record<string, string> = { ...TEXT_DEFAULTS };
    const styles: Record<string, TextStyle> = {};
    const images: Record<string, string> = {};
    for (const row of data?.texts ?? []) {
      const id = `${row.pageSlug}.${row.textKey}`;
      if (row.value?.trim()) texts[id] = row.value;
      if (row.style && Object.keys(row.style).length) styles[id] = row.style;
    }
    for (const row of data?.images ?? []) {
      if (row.url) images[`${row.pageSlug}.${row.imageKey}`] = row.url;
    }
    const typography: Typography = { ...TYPOGRAPHY_DEFAULT, ...(data?.typography ?? {}) };
    const maintenance: MaintenanceConfig = { ...MAINTENANCE_DEFAULT, ...(data?.maintenance ?? {}) };
    return {
      texts,
      styles,
      images,
      typography,
      maintenance,
      pageVisibility: data?.pageVisibility ?? {},
      buttons: data?.buttons ?? {},
    };

  }, [data]);

  const { fontDisplay, fontBody, scale } = value.typography;
  const fontsHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontDisplay).replace(/%20/g, "+")}:wght@400;500;600;700;800&family=${encodeURIComponent(fontBody).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap`;

  return (
    <SiteTextContext.Provider value={value}>
      <link rel="stylesheet" href={fontsHref} />
      <style
        dangerouslySetInnerHTML={{
          __html: `:root{--font-display:'${fontDisplay}',system-ui,sans-serif;--font-body:'${fontBody}',system-ui,sans-serif;--font-mono:'JetBrains Mono',ui-monospace,monospace;}html{font-size:${(scale || 1) * 100}%;}body{font-family:var(--font-body);}`,
        }}
      />
      {children}
    </SiteTextContext.Provider>
  );
}

/** Returns a translator for a page: t("hero.title") -> CMS value or default. */
export function useT(pageSlug: string) {
  const { texts } = useContext(SiteTextContext);
  return (key: string, fallback = "") => texts[`${pageSlug}.${key}`] ?? fallback;
}

export function useCms(pageSlug: string) {
  const { texts, styles, images } = useContext(SiteTextContext);
  return {
    t: (key: string, fallback = "") => texts[`${pageSlug}.${key}`] ?? fallback,
    style: (key: string) => styleToCss(styles[`${pageSlug}.${key}`]),
    hidden: (key: string) => Boolean(styles[`${pageSlug}.${key}`]?.hidden),
    image: (key: string, fallback: string) => images[`${pageSlug}.${key}`] ?? fallback,
  };
}

/** Image de page pilotée par le CMS, avec repli sur l'asset local. */
export function useCmsImage(pageSlug: string, key: string, fallback: string) {
  const { images } = useContext(SiteTextContext);
  return images[`${pageSlug}.${key}`] ?? fallback;
}

/** Texte CMS stylable (police, taille, couleur, alignement, position). */
export function Txt({
  page,
  k,
  fallback = "",
  className,
}: {
  page: string;
  k: string;
  fallback?: string;
  className?: string;
}) {
  const { texts, styles } = useContext(SiteTextContext);
  const id = `${page}.${k}`;
  const s = styles[id];
  if (s?.hidden) return null;
  return (
    <span data-cms={id} className={className} style={styleToCss(s)}>
      {texts[id] ?? fallback}
    </span>
  );
}

/** Tous les textes libres ajoutés depuis le CMS pour une page donnée. */
export function useCustomTexts(pageSlug: string) {
  const { texts, styles } = useContext(SiteTextContext);
  const prefix = `${pageSlug}.custom.`;
  return Object.keys(texts)
    .filter((id) => id.startsWith(prefix) && (texts[id] ?? "").trim())
    .sort()
    .map((id) => ({ id, value: texts[id]!, style: styles[id] }));
}

/** Réglages globaux (maintenance, visibilité des pages, boutons). */
export function useSiteConfig() {
  const { maintenance, pageVisibility, buttons } = useContext(SiteTextContext);
  return { maintenance, pageVisibility, buttons };
}

/** Une page est visible tant qu'elle n'a pas été explicitement masquée dans le CMS. */
export function usePageVisible(slug: string) {
  const { pageVisibility } = useContext(SiteTextContext);
  return pageVisibility[slug] !== false;
}

/** Boutons personnalisés créés depuis le CMS / l'IA pour une page. */
export function useCustomButtons(pageSlug: string): CustomButton[] {
  const { buttons } = useContext(SiteTextContext);
  return buttons[pageSlug] ?? [];
}

/** Bloc affichant les textes libres et boutons ajoutés dans le CMS. */
export function CustomTexts({ page }: { page: string }) {
  const items = useCustomTexts(page);
  const btns = useCustomButtons(page);
  const visible = items.filter((i) => !i.style?.hidden);
  if (visible.length === 0 && btns.length === 0) return null;
  return (
    <section className="relative mx-auto max-w-7xl px-5 pb-24 lg:px-8">
      <div className="glass space-y-4 p-8">
        {visible.map((i) => (
          <p key={i.id} data-cms={i.id} className="text-base leading-relaxed text-white/80" style={styleToCss(i.style)}>
            {i.value}
          </p>
        ))}
        {btns.length > 0 && (
          <div
            className={`flex flex-wrap gap-3 ${
              btns[0]?.align === "center" ? "justify-center" : btns[0]?.align === "right" ? "justify-end" : ""
            }`}
          >
            {btns.map((b) => (
              <a
                key={b.id}
                href={b.url || "#"}
                className={
                  b.variant === "ghost"
                    ? "btn-ghost-glow inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    : "btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                }
              >
                {b.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

