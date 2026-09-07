import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEXT_PAGES, type TextField, type TextStyle, type Typography } from "./site-text";
import {
  MAINTENANCE_DEFAULT,
  type CustomButton,
  type CustomButtonMap,
  type MaintenanceConfig,
  type PageVisibility,
} from "./site-config";

export type CmsAiAction =
  | { type: "text"; key: string; value: string }
  | { type: "style"; key: string; style: TextStyle }
  | { type: "addText"; key?: string; label: string; value: string }
  | { type: "deleteText"; key: string }
  | { type: "typography"; fontDisplay?: string; fontBody?: string; scale?: number }
  | { type: "partnerAdd"; name: string; websiteUrl?: string }
  | { type: "partnerDelete"; name: string }
  | { type: "pageAdd"; title: string }
  | { type: "pageRename"; slug: string; title: string }
  | { type: "pageDelete"; slug: string }
  | { type: "pageVisibility"; slug: string; visible: boolean }
  | { type: "buttonAdd"; label: string; url: string; variant?: "primary" | "ghost"; align?: "left" | "center" | "right" }
  | { type: "buttonUpdate"; label: string; newLabel?: string; url?: string; variant?: "primary" | "ghost"; align?: "left" | "center" | "right" }
  | { type: "buttonDelete"; label: string }
  | {
      type: "maintenance";
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      targetAt?: string;
      logoSize?: number;
    };

export type CmsAiResult = { summary: string; applied: string[]; actions: CmsAiAction[] };

type CustomFieldMap = Record<string, TextField[]>;


function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractJson(raw: string): { summary?: string; actions?: CmsAiAction[] } {
  const cleaned = raw.replace(/```json/gi, "```").split("```").join("").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Réponse IA illisible.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const SYSTEM = `Tu es l'assistant IA d'un CMS de site web (agence DODRICOM, site en français).
Tu modifies le contenu du site en renvoyant UNIQUEMENT du JSON, sans texte autour :
{"summary":"phrase courte en français","actions":[...]}

Actions possibles :
- {"type":"text","key":"hero.title","value":"..."} modifie un texte existant de la page courante
- {"type":"style","key":"hero.title","style":{"color":"#ff0000","size":"48px","weight":"700","align":"center","transform":"uppercase","letterSpacing":"2px","lineHeight":"1.2","offsetX":"10px","offsetY":"-4px","font":"display","hidden":false}} (n'inclure que les propriétés utiles)
- {"type":"addText","label":"Slogan promo","value":"..."} ajoute un texte libre sur la page courante
- {"type":"deleteText","key":"custom.xxx"} supprime un texte libre
- {"type":"typography","fontDisplay":"Poppins","fontBody":"Inter","scale":1.05}
- {"type":"partnerAdd","name":"Orange","websiteUrl":"https://..."}
- {"type":"partnerDelete","name":"Orange"}
- {"type":"pageAdd","title":"Tarifs"} / {"type":"pageRename","slug":"tarifs","title":"Nos tarifs"} / {"type":"pageDelete","slug":"tarifs"}
- {"type":"pageVisibility","slug":"blog","visible":false} affiche ou masque une page dans le site public
- {"type":"buttonAdd","label":"Demander un devis","url":"/contact","variant":"primary","align":"center"} crée un bouton sur la page courante
- {"type":"buttonUpdate","label":"Demander un devis","newLabel":"Nous écrire","url":"/contact"} modifie un bouton existant
- {"type":"buttonDelete","label":"Demander un devis"}
- {"type":"maintenance","enabled":true,"title":"Something is Happening!","subtitle":"...","targetAt":"2026-01-31T18:00:00.000Z","logoSize":90} pilote la page de maintenance et son compte à rebours

Règles : n'utilise que des clés existantes pour "text"/"style". Écris des textes en français, courts et percutants. Si la demande est ambiguë, fais la meilleure interprétation possible. Ne renvoie jamais d'explication hors du JSON.`;


export const runCmsAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string; pageSlug: string }) => {
    if (!input?.prompt?.trim()) throw new Error("Prompt vide.");
    return { prompt: input.prompt.trim().slice(0, 2000), pageSlug: input.pageSlug };
  })
  .handler(async ({ data, context }): Promise<CmsAiResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponible : clé manquante.");
    const supabase = context.supabase;
    const { pageSlug } = data;

    const [textsRes, settingsRes, pagesRes, partnersRes] = await Promise.all([
      supabase.from("content_texts").select("text_key, value, style").eq("page_slug", pageSlug),
      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["typography", "cms_custom_fields", "page_visibility", "cms_custom_buttons", "maintenance"]),
      supabase.from("pages").select("slug, title, sort_order").order("sort_order"),
      supabase.from("partners").select("id, name").order("sort_order"),
    ]);

    const setting = (k: string) => (settingsRes.data ?? []).find((s) => s.key === k)?.value;
    const customFields = (setting("cms_custom_fields") ?? {}) as CustomFieldMap;
    let visibility = (setting("page_visibility") ?? {}) as PageVisibility;
    let pageButtons = (setting("cms_custom_buttons") ?? {}) as CustomButtonMap;
    let maintenance = { ...MAINTENANCE_DEFAULT, ...((setting("maintenance") ?? {}) as Partial<MaintenanceConfig>) };
    const staticFields = TEXT_PAGES.find((p) => p.slug === pageSlug)?.fields ?? [];
    const fields = [...staticFields, ...(customFields[pageSlug] ?? [])];
    const values = new Map((textsRes.data ?? []).map((r) => [r.text_key, r.value as string]));

    const ctxDoc = {
      pageCourante: pageSlug,
      champs: fields.map((f) => ({ key: f.key, label: f.label, valeur: values.get(f.key) ?? f.def })),
      pages: (pagesRes.data ?? []).map((p) => ({ slug: p.slug, titre: p.title, visible: visibility[p.slug] !== false })),
      partenaires: (partnersRes.data ?? []).map((p) => p.name),
      boutons: pageButtons[pageSlug] ?? [],
      maintenance,
    };


    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Contenu actuel :\n${JSON.stringify(ctxDoc)}\n\nDemande : ${data.prompt}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Trop de requêtes IA, réessayez dans un instant.");
    if (res.status === 402) throw new Error("Crédits IA épuisés.");
    if (!res.ok) throw new Error(`Erreur IA (${res.status}) : ${(await res.text()).slice(0, 200)}`);

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const actions = (parsed.actions ?? []) as CmsAiAction[];
    const applied: string[] = [];
    let dirtyVisibility = false;
    let dirtyButtons = false;
    let dirtyMaintenance = false;

    let nextCustom = customFields;

    for (const action of actions) {
      switch (action.type) {
        case "text": {
          const { error } = await supabase
            .from("content_texts")
            .upsert(
              { page_slug: pageSlug, text_key: action.key, value: action.value, style: {} as never },
              { onConflict: "page_slug,text_key", ignoreDuplicates: false },
            )
            .select();
          if (error) throw new Error(error.message);
          applied.push(`Texte « ${action.key} » mis à jour`);
          break;
        }
        case "style": {
          const existing = (textsRes.data ?? []).find((r) => r.text_key === action.key);
          const merged = { ...((existing?.style ?? {}) as TextStyle), ...action.style };
          const { error } = await supabase.from("content_texts").upsert(
            {
              page_slug: pageSlug,
              text_key: action.key,
              value: values.get(action.key) ?? fields.find((f) => f.key === action.key)?.def ?? "",
              style: merged as never,
            },
            { onConflict: "page_slug,text_key" },
          );
          if (error) throw new Error(error.message);
          applied.push(`Style de « ${action.key} » modifié`);
          break;
        }
        case "addText": {
          const key = action.key?.startsWith("custom.")
            ? action.key
            : `custom.${slugify(action.label)}-${Date.now().toString(36).slice(-4)}`;
          const field: TextField = { key, label: action.label, def: action.value, multiline: true };
          nextCustom = { ...nextCustom, [pageSlug]: [...(nextCustom[pageSlug] ?? []), field] };
          await supabase
            .from("content_texts")
            .upsert(
              { page_slug: pageSlug, text_key: key, value: action.value, style: {} as never },
              { onConflict: "page_slug,text_key" },
            );
          applied.push(`Nouveau texte « ${action.label} » ajouté`);
          break;
        }
        case "deleteText": {
          nextCustom = {
            ...nextCustom,
            [pageSlug]: (nextCustom[pageSlug] ?? []).filter((f) => f.key !== action.key),
          };
          await supabase.from("content_texts").delete().eq("page_slug", pageSlug).eq("text_key", action.key);
          applied.push(`Texte « ${action.key} » supprimé`);
          break;
        }
        case "typography": {
          const currentTypo = ((settingsRes.data ?? []).find((s) => s.key === "typography")?.value ??
            {}) as Partial<Typography>;
          const next = {
            ...currentTypo,
            ...(action.fontDisplay ? { fontDisplay: action.fontDisplay } : {}),
            ...(action.fontBody ? { fontBody: action.fontBody } : {}),
            ...(action.scale ? { scale: action.scale } : {}),
          };
          await supabase
            .from("site_settings")
            .upsert({ key: "typography", value: next as never, label: "Typographie du site" }, { onConflict: "key" });
          applied.push("Typographie mise à jour");
          break;
        }
        case "partnerAdd": {
          const order = (partnersRes.data ?? []).length + 1;
          await supabase
            .from("partners")
            .insert({ name: action.name, website_url: action.websiteUrl ?? null, sort_order: order });
          applied.push(`Partenaire « ${action.name} » ajouté`);
          break;
        }
        case "partnerDelete": {
          const target = (partnersRes.data ?? []).find(
            (p) => p.name.toLowerCase() === action.name.toLowerCase(),
          );
          if (target) {
            await supabase.from("partners").delete().eq("id", target.id);
            applied.push(`Partenaire « ${action.name} » supprimé`);
          }
          break;
        }
        case "pageAdd": {
          const order = (pagesRes.data ?? []).length + 1;
          await supabase
            .from("pages")
            .insert({ slug: slugify(action.title), title: action.title, sort_order: order });
          applied.push(`Page « ${action.title} » créée`);
          break;
        }
        case "pageRename": {
          await supabase.from("pages").update({ title: action.title }).eq("slug", action.slug);
          applied.push(`Page « ${action.slug} » renommée`);
          break;
        }
        case "pageDelete": {
          if (TEXT_PAGES.some((p) => p.slug === action.slug)) break;
          await supabase.from("pages").delete().eq("slug", action.slug);
          applied.push(`Page « ${action.slug} » supprimée`);
          break;
        }
        case "pageVisibility": {
          visibility = { ...visibility, [action.slug]: action.visible };
          dirtyVisibility = true;
          applied.push(`Page « ${action.slug} » ${action.visible ? "affichée" : "masquée"}`);
          break;
        }
        case "buttonAdd": {
          const btn: CustomButton = {
            id: `btn-${Date.now().toString(36)}-${Math.random().toString(36).slice(-3)}`,
            label: action.label,
            url: action.url,
            variant: action.variant ?? "primary",
            align: action.align ?? "left",
          };
          pageButtons = { ...pageButtons, [pageSlug]: [...(pageButtons[pageSlug] ?? []), btn] };
          dirtyButtons = true;
          applied.push(`Bouton « ${action.label} » créé`);
          break;
        }
        case "buttonUpdate": {
          pageButtons = {
            ...pageButtons,
            [pageSlug]: (pageButtons[pageSlug] ?? []).map((b) =>
              b.label.toLowerCase() === action.label.toLowerCase()
                ? {
                    ...b,
                    ...(action.newLabel ? { label: action.newLabel } : {}),
                    ...(action.url ? { url: action.url } : {}),
                    ...(action.variant ? { variant: action.variant } : {}),
                    ...(action.align ? { align: action.align } : {}),
                  }
                : b,
            ),
          };
          dirtyButtons = true;
          applied.push(`Bouton « ${action.label} » modifié`);
          break;
        }
        case "buttonDelete": {
          pageButtons = {
            ...pageButtons,
            [pageSlug]: (pageButtons[pageSlug] ?? []).filter((b) => b.label.toLowerCase() !== action.label.toLowerCase()),
          };
          dirtyButtons = true;
          applied.push(`Bouton « ${action.label} » supprimé`);
          break;
        }
        case "maintenance": {
          maintenance = {
            ...maintenance,
            ...(action.enabled !== undefined ? { enabled: action.enabled } : {}),
            ...(action.title ? { title: action.title } : {}),
            ...(action.subtitle ? { subtitle: action.subtitle } : {}),
            ...(action.targetAt ? { targetAt: action.targetAt } : {}),
            ...(action.logoSize ? { logoSize: action.logoSize } : {}),
          };
          dirtyMaintenance = true;
          applied.push("Page de maintenance mise à jour");
          break;
        }
        default:
          break;
      }
    }

    if (nextCustom !== customFields) {
      await supabase
        .from("site_settings")
        .upsert(
          { key: "cms_custom_fields", value: nextCustom as never, label: "Champs texte personnalisés" },
          { onConflict: "key" },
        );
    }
    if (dirtyVisibility)
      await supabase
        .from("site_settings")
        .upsert({ key: "page_visibility", value: visibility as never, label: "Visibilité des pages" }, { onConflict: "key" });
    if (dirtyButtons)
      await supabase
        .from("site_settings")
        .upsert({ key: "cms_custom_buttons", value: pageButtons as never, label: "Boutons personnalisés" }, { onConflict: "key" });
    if (dirtyMaintenance)
      await supabase
        .from("site_settings")
        .upsert({ key: "maintenance", value: maintenance as never, label: "Mode maintenance" }, { onConflict: "key" });


    return { summary: parsed.summary ?? "Modifications appliquées.", applied, actions };
  });
