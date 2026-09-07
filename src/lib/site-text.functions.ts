import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { TextStyle, Typography } from "./site-text";
import type { CustomButtonMap, MaintenanceConfig, PageVisibility } from "./site-config";

export type SiteTextRow = { pageSlug: string; textKey: string; value: string; style: TextStyle };
export type SiteImageRow = { pageSlug: string; imageKey: string; url: string | null };
export type SiteContent = {
  texts: SiteTextRow[];
  images: SiteImageRow[];
  typography: Partial<Typography> | null;
  maintenance: Partial<MaintenanceConfig> | null;
  pageVisibility: PageVisibility;
  buttons: CustomButtonMap;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<SiteContent> => {
  const supabase = publicClient();
  const [textsRes, imagesRes, settingsRes] = await Promise.all([
    supabase.from("content_texts").select("page_slug, text_key, value, style"),
    supabase.from("content_images").select("page_slug, image_key, url"),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["typography", "maintenance", "page_visibility", "cms_custom_buttons"]),
  ]);

  const settings = new Map((settingsRes.data ?? []).map((r) => [r.key, r.value]));

  return {
    texts: (textsRes.data ?? []).map((r) => ({
      pageSlug: r.page_slug,
      textKey: r.text_key,
      value: r.value,
      style: (r.style ?? {}) as TextStyle,
    })),
    images: (imagesRes.data ?? []).map((r) => ({
      pageSlug: r.page_slug,
      imageKey: r.image_key,
      url: r.url,
    })),
    typography: (settings.get("typography") ?? null) as Partial<Typography> | null,
    maintenance: (settings.get("maintenance") ?? null) as Partial<MaintenanceConfig> | null,
    pageVisibility: (settings.get("page_visibility") ?? {}) as PageVisibility,
    buttons: (settings.get("cms_custom_buttons") ?? {}) as CustomButtonMap,
  };
});
