import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Code2,
  Eraser,
  Eye,
  EyeOff,
  FolderTree,
  Handshake,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  MousePointerClick,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wrench,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { MaintenanceAccess } from "@/components/admin/MaintenanceAccess";
import { FileExplorer } from "@/components/admin/FileExplorer";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { runCmsAi, type CmsAiResult } from "@/lib/cms-ai.functions";
import {
  FONT_CHOICES,
  IMAGE_PAGES,
  TEXT_PAGES,
  TYPOGRAPHY_DEFAULT,
  type TextField,
  type TextStyle,
  type Typography,
} from "@/lib/site-text";
import {
  MAINTENANCE_DEFAULT,
  type CustomButton,
  type CustomButtonMap,
  type MaintenanceConfig,
  type PageVisibility,
} from "@/lib/site-config";

export const Route = createFileRoute("/admin/cms")({ component: CmsPage });

type Tab = "texts" | "ai" | "files" | "images" | "pages" | "buttons" | "partners" | "maintenance" | "typo" | "code";
type CmsPageRow = { id: string; slug: string; title: string; sort_order: number };
type PartnerRow = { id: string; name: string; logo_url: string | null; website_url: string | null; sort_order: number };
type CustomFieldMap = Record<string, TextField[]>;
type Snapshot = {
  at: string;
  texts: { page_slug: string; text_key: string; value: string; style: TextStyle }[];
  typography: Typography;
  customFields: CustomFieldMap;
  pageVisibility: PageVisibility;
  buttons: CustomButtonMap;
  maintenance: MaintenanceConfig;
};


const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60";
const chipCls =
  "rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/70 outline-none focus:border-[color:var(--brand-violet)]/60";
const btnCls =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 hover:text-white";

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CmsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("texts");
  const [activeSlug, setActiveSlug] = useState(TEXT_PAGES[0]!.slug);
  const [values, setValues] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<Record<string, TextStyle>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [typo, setTypo] = useState<Typography>(TYPOGRAPHY_DEFAULT);
  const [customFields, setCustomFields] = useState<CustomFieldMap>({});
  const [dbPages, setDbPages] = useState<CmsPageRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [visibility, setVisibility] = useState<PageVisibility>({});
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(MAINTENANCE_DEFAULT);
  const [buttons, setButtons] = useState<CustomButtonMap>({});
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const [openStyle, setOpenStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [code, setCode] = useState("");
  const [newPage, setNewPage] = useState({ title: "", slug: "" });
  const [cacheCleared, setCacheCleared] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<CmsAiResult | null>(null);
  const callAi = useServerFn(runCmsAi);

  const clearCache = async () => {
    try {
      queryClient.clear();
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem("site-texts");
          window.sessionStorage.clear();
        } catch {
          /* stockage indisponible */
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      }
      await queryClient.invalidateQueries();
      await reload();
      setCacheCleared(true);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const askAi = async () => {
    setAiLoading(true);
    setError(null);
    setAiResult(null);
    try {
      const res = await callAi({ data: { prompt: aiPrompt, pageSlug } });
      setAiResult(res);
      await reload();
      await queryClient.invalidateQueries({ queryKey: ["site-texts"] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const staticPage = TEXT_PAGES.find((p) => p.slug === activeSlug);
  const imagePage = IMAGE_PAGES.find((p) => p.slug === activeSlug);

  const pageList = useMemo(() => {
    const rows = dbPages.length
      ? dbPages
      : TEXT_PAGES.map((p, i) => ({ id: p.slug, slug: p.slug, title: p.name, sort_order: i + 1 }));
    return [...rows].sort((a, b) => a.sort_order - b.sort_order);
  }, [dbPages]);

  const currentPage = pageList.find((p) => p.slug === activeSlug) ?? pageList[0];
  const pageSlug = currentPage?.slug ?? activeSlug;
  const pageName = currentPage?.title ?? staticPage?.name ?? activeSlug;
  const pageRoute = staticPage?.route ?? `/${pageSlug}`;
  const isStaticPage = Boolean(staticPage);

  const pageFields = useMemo<TextField[]>(
    () => [...(TEXT_PAGES.find((p) => p.slug === pageSlug)?.fields ?? []), ...(customFields[pageSlug] ?? [])],
    [pageSlug, customFields],
  );

  const reload = async () => {
    const [texts, imgs, settings, pagesRes, partnersRes] = await Promise.all([
      supabase.from("content_texts").select("page_slug, text_key, value, style"),
      supabase.from("content_images").select("page_slug, image_key, url"),
      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "typography",
          "cms_custom_fields",
          "maintenance",
          "page_visibility",
          "cms_custom_buttons",
          "cms_snapshots",
        ]),
      supabase.from("pages").select("id, slug, title, sort_order").order("sort_order"),
      supabase.from("partners").select("id, name, logo_url, website_url, sort_order").order("sort_order"),
    ]);
    if (texts.error) setError(texts.error.message);
    const v: Record<string, string> = {};
    const st: Record<string, TextStyle> = {};
    for (const row of texts.data ?? []) {
      v[`${row.page_slug}.${row.text_key}`] = row.value;
      st[`${row.page_slug}.${row.text_key}`] = (row.style ?? {}) as TextStyle;
    }
    const im: Record<string, string> = {};
    for (const row of imgs.data ?? []) if (row.url) im[`${row.page_slug}.${row.image_key}`] = row.url;
    const setting = (k: string) => (settings.data ?? []).find((s) => s.key === k)?.value;
    setValues(v);
    setStyles(st);
    setImages(im);
    setTypo({ ...TYPOGRAPHY_DEFAULT, ...((setting("typography") as Partial<Typography>) ?? {}) });
    setCustomFields(((setting("cms_custom_fields") as CustomFieldMap) ?? {}) as CustomFieldMap);
    setMaintenance({ ...MAINTENANCE_DEFAULT, ...((setting("maintenance") as Partial<MaintenanceConfig>) ?? {}) });
    setVisibility(((setting("page_visibility") as PageVisibility) ?? {}) as PageVisibility);
    setButtons(((setting("cms_custom_buttons") as CustomButtonMap) ?? {}) as CustomButtonMap);
    setSnapshots(((setting("cms_snapshots") as Snapshot[]) ?? []) as Snapshot[]);
    setDbPages((pagesRes.data ?? []) as CmsPageRow[]);
    setPartners((partnersRes.data ?? []) as PartnerRow[]);
  };

  const putSetting = async (key: string, value: unknown, label: string) => {
    const { error: err } = await supabase
      .from("site_settings")
      .upsert({ key, value: value as never, label }, { onConflict: "key" });
    if (err) setError(err.message);
  };

  const refreshSite = () => queryClient.invalidateQueries({ queryKey: ["site-texts"] });


  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      await reload();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pageFields;
    return pageFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.def.toLowerCase().includes(q) ||
        (values[`${pageSlug}.${f.key}`] ?? "").toLowerCase().includes(q),
    );
  }, [pageFields, pageSlug, search, values]);

  const current = (key: string) => values[`${pageSlug}.${key}`] ?? "";
  const styleOf = (key: string): TextStyle => styles[`${pageSlug}.${key}`] ?? {};

  const setValue = (key: string, value: string) => {
    setSaved(false);
    setValues((p) => ({ ...p, [`${pageSlug}.${key}`]: value }));
  };
  const setStyle = (key: string, patch: Partial<TextStyle>) => {
    setSaved(false);
    setStyles((p) => ({ ...p, [`${pageSlug}.${key}`]: { ...(p[`${pageSlug}.${key}`] ?? {}), ...patch } }));
  };

  const persistCustomFields = async (next: CustomFieldMap) => {
    const { error: err } = await supabase
      .from("site_settings")
      .upsert({ key: "cms_custom_fields", value: next as never, label: "Champs texte personnalisés" }, { onConflict: "key" });
    if (err) setError(err.message);
  };

  const addCustomField = async () => {
    const label = window.prompt("Nom du nouveau texte (ex : Slogan promo)");
    if (!label?.trim()) return;
    const key = `custom.${slugify(label)}-${Date.now().toString(36).slice(-4)}`;
    const field: TextField = { key, label: label.trim(), def: label.trim(), multiline: true };
    const next = { ...customFields, [pageSlug]: [...(customFields[pageSlug] ?? []), field] };
    setCustomFields(next);
    setValues((p) => ({ ...p, [`${pageSlug}.${key}`]: label.trim() }));
    await persistCustomFields(next);
  };

  const deleteCustomField = async (key: string) => {
    if (!confirm("Supprimer définitivement ce texte ?")) return;
    const next = { ...customFields, [pageSlug]: (customFields[pageSlug] ?? []).filter((f) => f.key !== key) };
    setCustomFields(next);
    setValues((p) => {
      const n = { ...p };
      delete n[`${pageSlug}.${key}`];
      return n;
    });
    await supabase.from("content_texts").delete().eq("page_slug", pageSlug).eq("text_key", key);
    await persistCustomFields(next);
    await queryClient.invalidateQueries({ queryKey: ["site-texts"] });
  };

  // ---- code mode -------------------------------------------------------
  useEffect(() => {
    if (!codeMode) return;
    const obj: Record<string, { value: string; style: TextStyle }> = {};
    for (const f of pageFields) obj[f.key] = { value: current(f.key) || f.def, style: styleOf(f.key) };
    setCode(JSON.stringify(obj, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeMode, pageSlug]);

  const applyCode = () => {
    try {
      const parsed = JSON.parse(code) as Record<string, { value?: string; style?: TextStyle }>;
      setValues((p) => {
        const next = { ...p };
        for (const [k, v] of Object.entries(parsed)) if (typeof v?.value === "string") next[`${pageSlug}.${k}`] = v.value;
        return next;
      });
      setStyles((p) => {
        const next = { ...p };
        for (const [k, v] of Object.entries(parsed)) if (v?.style) next[`${pageSlug}.${k}`] = v.style;
        return next;
      });
      setError(null);
      setSaved(false);
    } catch (e) {
      setError(`JSON invalide : ${(e as Error).message}`);
    }
  };

  // ---- sauvegardes (snapshots) ----------------------------------------
  const takeSnapshot = async (): Promise<Snapshot[]> => {
    const { data } = await supabase.from("content_texts").select("page_slug, text_key, value, style");
    const snap: Snapshot = {
      at: new Date().toISOString(),
      texts: ((data ?? []) as { page_slug: string; text_key: string; value: string; style: TextStyle }[]).map((r) => ({
        page_slug: r.page_slug,
        text_key: r.text_key,
        value: r.value,
        style: (r.style ?? {}) as TextStyle,
      })),
      typography: typo,
      customFields,
      pageVisibility: visibility,
      buttons,
      maintenance,
    };
    const next = [snap, ...snapshots].slice(0, 10);
    setSnapshots(next);
    await putSetting("cms_snapshots", next, "Sauvegardes automatiques du CMS");
    return next;
  };

  const restoreSnapshot = async (snap: Snapshot) => {
    if (!confirm(`Restaurer la sauvegarde du ${new Date(snap.at).toLocaleString("fr-FR")} ?`)) return;
    setSaving(true);
    setError(null);
    if (snap.texts.length) {
      const { error: err } = await supabase
        .from("content_texts")
        .upsert(
          snap.texts.map((t) => ({ page_slug: t.page_slug, text_key: t.text_key, value: t.value, style: t.style as never })),
          { onConflict: "page_slug,text_key" },
        );
      if (err) setError(err.message);
    }
    await Promise.all([
      putSetting("typography", snap.typography, "Typographie du site"),
      putSetting("cms_custom_fields", snap.customFields ?? {}, "Champs texte personnalisés"),
      putSetting("page_visibility", snap.pageVisibility ?? {}, "Visibilité des pages"),
      putSetting("cms_custom_buttons", snap.buttons ?? {}, "Boutons personnalisés"),
      putSetting("maintenance", snap.maintenance ?? MAINTENANCE_DEFAULT, "Mode maintenance"),
    ]);
    await reload();
    await refreshSite();
    setSaving(false);
  };

  // ---- persistence -----------------------------------------------------
  const save = async () => {
    setSaving(true);
    setError(null);
    await takeSnapshot();
    const rows = pageFields.map((f) => ({
      page_slug: pageSlug,
      text_key: f.key,
      value: current(f.key) || f.def,
      style: styleOf(f.key) as never,
    }));
    const { error: err } = await supabase.from("content_texts").upsert(rows, { onConflict: "page_slug,text_key" });
    if (!err) {
      await putSetting("typography", typo, "Typographie du site");
      await putSetting("page_visibility", visibility, "Visibilité des pages");
      await putSetting("cms_custom_buttons", buttons, "Boutons personnalisés");
      await putSetting("maintenance", maintenance, "Mode maintenance");
      await persistCustomFields(customFields);
    }
    setSaving(false);
    if (err) return setError(err.message);
    setSaved(true);
    await refreshSite();
  };

  const resetPage = () => {
    if (!confirm("Rétablir les textes et styles d'origine de cette page ?")) return;
    setSaved(false);
    setValues((p) => {
      const next = { ...p };
      for (const f of pageFields) next[`${pageSlug}.${f.key}`] = f.def;
      return next;
    });
    setStyles((p) => {
      const next = { ...p };
      for (const f of pageFields) next[`${pageSlug}.${f.key}`] = {};
      return next;
    });
  };

  // ---- visibilité des pages / boutons ----------------------------------
  const toggleVisibility = async (slug: string) => {
    const next = { ...visibility, [slug]: visibility[slug] === false };
    setVisibility(next);
    await putSetting("page_visibility", next, "Visibilité des pages");
    await refreshSite();
  };

  const persistButtons = async (next: CustomButtonMap) => {
    setButtons(next);
    await putSetting("cms_custom_buttons", next, "Boutons personnalisés");
    await refreshSite();
  };

  const addButton = async () => {
    const list = buttons[pageSlug] ?? [];
    const btn: CustomButton = {
      id: `btn-${Date.now().toString(36)}`,
      label: "Nouveau bouton",
      url: "/contact",
      variant: "primary",
      align: "left",
    };
    await persistButtons({ ...buttons, [pageSlug]: [...list, btn] });
  };

  const updateButton = async (id: string, patch: Partial<CustomButton>) => {
    const next = {
      ...buttons,
      [pageSlug]: (buttons[pageSlug] ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    };
    setButtons(next);
  };

  const saveButtons = async () => persistButtons(buttons);

  const deleteButton = async (id: string) => {
    await persistButtons({ ...buttons, [pageSlug]: (buttons[pageSlug] ?? []).filter((b) => b.id !== id) });
  };

  // ---- maintenance -----------------------------------------------------
  const patchMaintenance = async (patch: Partial<MaintenanceConfig>) => {
    const next = { ...maintenance, ...patch };
    setMaintenance(next);
    await putSetting("maintenance", next, "Mode maintenance");
    await refreshSite();
  };


  // ---- images ----------------------------------------------------------
  const uploadToCms = async (path: string, file: File) => {
    const up = await supabase.storage.from("cms").upload(path, file, { upsert: true });
    if (up.error) {
      setError(up.error.message);
      return null;
    }
    const signed = await supabase.storage.from("cms").createSignedUrl(path, 60 * 60 * 24 * 3650);
    if (!signed.data?.signedUrl) {
      setError(signed.error?.message ?? "URL introuvable");
      return null;
    }
    return signed.data.signedUrl;
  };

  const uploadMaintenance = async (kind: "backgroundUrl" | "logoUrl", file: File) => {
    setError(null);
    const url = await uploadToCms(`maintenance/${kind}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`, file);
    if (url) await patchMaintenance({ [kind]: url } as Partial<MaintenanceConfig>);
  };



  const uploadImage = async (key: string, file: File) => {
    setError(null);
    const path = `${pageSlug}/${key.replace(/\./g, "-")}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const url = await uploadToCms(path, file);
    if (!url) return;
    const { error: err } = await supabase
      .from("content_images")
      .upsert({ page_slug: pageSlug, image_key: key, url }, { onConflict: "page_slug,image_key" });
    if (err) return setError(err.message);
    setImages((p) => ({ ...p, [`${pageSlug}.${key}`]: url }));
    await queryClient.invalidateQueries({ queryKey: ["site-texts"] });
  };

  const removeImage = async (key: string) => {
    await supabase.from("content_images").delete().eq("page_slug", pageSlug).eq("image_key", key);
    setImages((p) => {
      const next = { ...p };
      delete next[`${pageSlug}.${key}`];
      return next;
    });
    await queryClient.invalidateQueries({ queryKey: ["site-texts"] });
  };

  // ---- pages -----------------------------------------------------------
  const addPage = async () => {
    const title = newPage.title.trim();
    const slug = slugify(newPage.slug || newPage.title);
    if (!title || !slug) return setError("Renseignez un nom et une adresse de page.");
    const max = Math.max(0, ...pageList.map((p) => p.sort_order));
    const { error: err } = await supabase.from("pages").insert({ slug, title, sort_order: max + 1, status: "published" });
    if (err) return setError(err.message);
    setNewPage({ title: "", slug: "" });
    setError(null);
    await reload();
  };

  const renamePage = async (id: string, title: string) => {
    setDbPages((p) => p.map((x) => (x.id === id ? { ...x, title } : x)));
    const { error: err } = await supabase.from("pages").update({ title }).eq("id", id);
    if (err) setError(err.message);
  };

  const deletePage = async (row: CmsPageRow) => {
    if (!confirm(`Supprimer la page « ${row.title} » et tous ses textes ?`)) return;
    await supabase.from("content_texts").delete().eq("page_slug", row.slug);
    await supabase.from("content_images").delete().eq("page_slug", row.slug);
    const { error: err } = await supabase.from("pages").delete().eq("id", row.id);
    if (err) return setError(err.message);
    const nextCustom = { ...customFields };
    delete nextCustom[row.slug];
    setCustomFields(nextCustom);
    await persistCustomFields(nextCustom);
    if (activeSlug === row.slug) setActiveSlug(TEXT_PAGES[0]!.slug);
    await reload();
    await queryClient.invalidateQueries({ queryKey: ["site-texts"] });
  };

  const movePage = async (index: number, dir: -1 | 1) => {
    const a = pageList[index];
    const b = pageList[index + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("pages").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("pages").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await reload();
  };

  // ---- partners --------------------------------------------------------
  const addPartner = async () => {
    const max = Math.max(0, ...partners.map((p) => p.sort_order));
    const { error: err } = await supabase
      .from("partners")
      .insert({ name: "Nouveau partenaire", sort_order: max + 1, status: "published" });
    if (err) return setError(err.message);
    await reload();
    await queryClient.invalidateQueries({ queryKey: ["partners-public"] });
  };

  const updatePartner = async (id: string, patch: Partial<PartnerRow>) => {
    setPartners((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error: err } = await supabase.from("partners").update(patch).eq("id", id);
    if (err) setError(err.message);
    await queryClient.invalidateQueries({ queryKey: ["partners-public"] });
  };

  const deletePartner = async (id: string) => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    const { error: err } = await supabase.from("partners").delete().eq("id", id);
    if (err) return setError(err.message);
    setPartners((p) => p.filter((x) => x.id !== id));
    await queryClient.invalidateQueries({ queryKey: ["partners-public"] });
  };

  const movePartner = async (index: number, dir: -1 | 1) => {
    const a = partners[index];
    const b = partners[index + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("partners").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("partners").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await reload();
    await queryClient.invalidateQueries({ queryKey: ["partners-public"] });
  };

  const uploadPartnerLogo = async (id: string, file: File) => {
    setError(null);
    const url = await uploadToCms(`partners/${id}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`, file);
    if (url) await updatePartner(id, { logo_url: url });
  };

  const tabs: { id: Tab; label: string; icon: typeof Type }[] = [
    { id: "texts", label: "Textes", icon: Type },
    { id: "ai", label: "IA", icon: Sparkles },
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "pages", label: "Pages", icon: Layers },
    { id: "buttons", label: "Boutons", icon: MousePointerClick },
    { id: "partners", label: "Partenaires", icon: Handshake },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "files", label: "Fichiers", icon: FolderTree },
    { id: "typo", label: "Typographie", icon: Settings2 },
    { id: "code", label: "Mode code", icon: Code2 },
  ];
  const lastSnapshot = snapshots[0];


  return (
    <AdminShell title="Website Builder (CMS)" breadcrumbs={[{ label: "Website Builder (CMS)" }]}>
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="glass h-fit p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Pages du site</p>
          <div className="space-y-1">
            {pageList.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  setActiveSlug(p.slug);
                  setSaved(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  p.slug === pageSlug
                    ? "bg-white/[0.08] text-white"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span className="font-medium">{p.title}</span>
                <span className="text-[10px] text-white/35">
                  {(TEXT_PAGES.find((s) => s.slug === p.slug)?.fields.length ?? 0) + (customFields[p.slug]?.length ?? 0)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="glass p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{pageName}</h2>
              <p className="text-xs text-white/50">
                Tout ce qui est modifié ici s'applique immédiatement à la page {pageRoute}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void clearCache()} className={btnCls} title="Vider le cache du navigateur et recharger les contenus">
                <Eraser className="h-3.5 w-3.5" /> {cacheCleared ? "Cache vidé" : "Vider le cache"}
              </button>
              <button
                onClick={() => lastSnapshot && void restoreSnapshot(lastSnapshot)}
                disabled={!lastSnapshot || saving}
                title={
                  lastSnapshot
                    ? `Restaurer la sauvegarde du ${new Date(lastSnapshot.at).toLocaleString("fr-FR")}`
                    : "Aucune sauvegarde disponible"
                }
                className={`${btnCls} disabled:opacity-40`}
              >
                <History className="h-3.5 w-3.5" /> Réinitialiser (dernière sauvegarde)
              </button>
              <button onClick={resetPage} className={btnCls}>
                <RotateCcw className="h-3.5 w-3.5" /> Valeurs d'origine
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saved ? "Enregistré" : "Enregistrer"}
              </button>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => {
                  setTab(tb.id);
                  if (tb.id === "code") setCodeMode(true);
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  tab === tb.id ? "bg-white/[0.1] text-white" : "text-white/55 hover:text-white"
                }`}
              >
                <tb.icon className="h-3.5 w-3.5" /> {tb.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>
          )}

          {loading ? (
            <p className="text-sm text-white/50">Chargement du contenu…</p>
          ) : tab === "texts" ? (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <Search className="h-4 w-4 text-white/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un texte…"
                    className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                  />
                </div>
                <button onClick={() => void addCustomField()} className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Ajouter un texte
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((f) => {
                  const id = `${pageSlug}.${f.key}`;
                  const st = styleOf(f.key);
                  const isCustom = f.key.startsWith("custom.");
                  return (
                    <div key={f.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{f.label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setOpenStyle(openStyle === id ? null : id)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                              openStyle === id || Object.keys(st).length
                                ? "border-[color:var(--brand-violet)]/60 text-white"
                                : "border-white/10 text-white/50 hover:text-white"
                            }`}
                          >
                            <Sliders className="h-3 w-3" /> Style
                          </button>
                          {isCustom && (
                            <button
                              onClick={() => void deleteCustomField(f.key)}
                              className="rounded-lg border border-rose-400/30 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-400/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      {f.multiline ? (
                        <textarea
                          rows={4}
                          value={current(f.key) || f.def}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          className={`${inputCls} resize-none`}
                        />
                      ) : (
                        <input
                          value={current(f.key) || f.def}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          className={inputCls}
                        />
                      )}

                      {openStyle === id && (
                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                          <label className="text-[10px] text-white/45">
                            Police
                            <select
                              value={st.font ?? ""}
                              onChange={(e) => setStyle(f.key, { font: (e.target.value || undefined) as TextStyle["font"] })}
                              className={`${chipCls} mt-1 w-full`}
                            >
                              <option value="">Par défaut</option>
                              <option value="display">Titre</option>
                              <option value="body">Texte</option>
                              <option value="mono">Mono</option>
                            </select>
                          </label>
                          <label className="text-[10px] text-white/45">
                            Taille (ex: 2rem)
                            <input
                              value={st.size ?? ""}
                              onChange={(e) => setStyle(f.key, { size: e.target.value || undefined })}
                              className={`${chipCls} mt-1 w-full`}
                            />
                          </label>
                          <label className="text-[10px] text-white/45">
                            Graisse
                            <select
                              value={st.weight ?? ""}
                              onChange={(e) => setStyle(f.key, { weight: e.target.value || undefined })}
                              className={`${chipCls} mt-1 w-full`}
                            >
                              <option value="">Par défaut</option>
                              {["300", "400", "500", "600", "700", "800"].map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-[10px] text-white/45">
                            Couleur
                            <input
                              type="color"
                              value={st.color ?? "#ffffff"}
                              onChange={(e) => setStyle(f.key, { color: e.target.value })}
                              className="mt-1 h-[26px] w-full rounded-lg border border-white/10 bg-transparent"
                            />
                          </label>
                          <label className="text-[10px] text-white/45">
                            Alignement
                            <select
                              value={st.align ?? ""}
                              onChange={(e) => setStyle(f.key, { align: (e.target.value || undefined) as TextStyle["align"] })}
                              className={`${chipCls} mt-1 w-full`}
                            >
                              <option value="">Par défaut</option>
                              <option value="left">Gauche</option>
                              <option value="center">Centre</option>
                              <option value="right">Droite</option>
                            </select>
                          </label>
                          <label className="text-[10px] text-white/45">
                            Casse
                            <select
                              value={st.transform ?? ""}
                              onChange={(e) =>
                                setStyle(f.key, { transform: (e.target.value || undefined) as TextStyle["transform"] })
                              }
                              className={`${chipCls} mt-1 w-full`}
                            >
                              <option value="">Par défaut</option>
                              <option value="uppercase">MAJUSCULES</option>
                              <option value="lowercase">minuscules</option>
                              <option value="capitalize">Capitales</option>
                            </select>
                          </label>
                          <label className="text-[10px] text-white/45">
                            Position X (ex: 20px)
                            <input
                              value={st.offsetX ?? ""}
                              onChange={(e) => setStyle(f.key, { offsetX: e.target.value || undefined })}
                              className={`${chipCls} mt-1 w-full`}
                            />
                          </label>
                          <label className="text-[10px] text-white/45">
                            Position Y (ex: -10px)
                            <input
                              value={st.offsetY ?? ""}
                              onChange={(e) => setStyle(f.key, { offsetY: e.target.value || undefined })}
                              className={`${chipCls} mt-1 w-full`}
                            />
                          </label>
                          <label className="col-span-2 flex items-center gap-2 text-[11px] text-white/60">
                            <input
                              type="checkbox"
                              checked={Boolean(st.hidden)}
                              onChange={(e) => setStyle(f.key, { hidden: e.target.checked })}
                            />
                            Masquer ce texte sur le site
                          </label>
                          <button
                            onClick={() => setStyles((p) => ({ ...p, [id]: {} }))}
                            className="col-span-2 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:text-white"
                          >
                            Réinitialiser le style
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-white/40">
                Les textes ajoutés apparaissent en bas de la page concernée, dans le bloc « textes libres ». N'oubliez pas
                d'enregistrer.
              </p>
            </>
          ) : tab === "images" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {!imagePage ? (
                <p className="text-sm text-white/50">
                  Aucune image modifiable sur cette page. (Les images des produits se gèrent dans Commercial (CRM).)
                </p>
              ) : (
                imagePage.fields.map((f) => {
                  const url = images[`${pageSlug}.${f.key}`];
                  return (
                    <div key={f.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">{f.label}</p>
                      <div className="mb-3 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        {url ? (
                          <img src={url} alt={f.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-white/35">
                            Image par défaut du site
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="btn-gradient inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                          <Upload className="h-3.5 w-3.5" /> Téléverser
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadImage(f.key, file);
                            }}
                          />
                        </label>
                        {url && (
                          <button onClick={() => void removeImage(f.key)} className={btnCls}>
                            Rétablir l'originale
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : tab === "pages" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  className={inputCls}
                  placeholder="Nom de la page"
                  value={newPage.title}
                  onChange={(e) => setNewPage((p) => ({ ...p, title: e.target.value }))}
                />
                <input
                  className={inputCls}
                  placeholder="adresse-de-la-page"
                  value={newPage.slug}
                  onChange={(e) => setNewPage((p) => ({ ...p, slug: e.target.value }))}
                />
                <button onClick={() => void addPage()} className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Ajouter la page
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                {pageList.map((p, i) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
                    <input
                      value={p.title}
                      onChange={(e) => void renamePage(p.id, e.target.value)}
                      className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                    />
                    <span className="text-xs text-white/40">/{p.slug}</span>
                    <button
                      onClick={() => void toggleVisibility(p.slug)}
                      title={visibility[p.slug] === false ? "Page masquée aux visiteurs" : "Page visible par les visiteurs"}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        visibility[p.slug] === false
                          ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
                          : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      }`}
                    >
                      {visibility[p.slug] === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {visibility[p.slug] === false ? "Masquée" : "Visible"}
                    </button>
                    <div className="ml-auto flex items-center gap-1">

                      <button onClick={() => void movePage(i, -1)} disabled={i === 0} className={`${btnCls} disabled:opacity-30`}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void movePage(i, 1)}
                        disabled={i === pageList.length - 1}
                        className={`${btnCls} disabled:opacity-30`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void deletePage(p)}
                        disabled={Boolean(TEXT_PAGES.find((s) => s.slug === p.slug))}
                        title={
                          TEXT_PAGES.find((s) => s.slug === p.slug)
                            ? "Page principale du site : elle ne peut pas être supprimée."
                            : "Supprimer la page"
                        }
                        className="rounded-xl border border-rose-400/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/40">
                L'ordre défini ici pilote l'ordre des pages dans le CMS et le menu du site. Les pages principales du site ne
                peuvent pas être supprimées, mais elles peuvent être renommées et réordonnées.
              </p>
            </div>
          ) : tab === "buttons" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-white/50">
                  Boutons personnalisés affichés en bas de la page <strong>{pageName}</strong>.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => void addButton()} className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5" /> Ajouter un bouton
                  </button>
                  <button onClick={() => void saveButtons()} className={btnCls}>
                    <Save className="h-3.5 w-3.5" /> Enregistrer les boutons
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(buttons[pageSlug] ?? []).map((b) => (
                  <div key={b.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <input
                      value={b.label}
                      onChange={(e) => void updateButton(b.id, { label: e.target.value })}
                      placeholder="Texte du bouton"
                      className={inputCls}
                    />
                    <input
                      value={b.url}
                      onChange={(e) => void updateButton(b.id, { url: e.target.value })}
                      placeholder="/contact ou https://…"
                      className={inputCls}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={b.variant ?? "primary"}
                        onChange={(e) => void updateButton(b.id, { variant: e.target.value as CustomButton["variant"] })}
                        className={chipCls}
                      >
                        <option value="primary">Bouton plein</option>
                        <option value="ghost">Bouton contour</option>
                      </select>
                      <select
                        value={b.align ?? "left"}
                        onChange={(e) => void updateButton(b.id, { align: e.target.value as CustomButton["align"] })}
                        className={chipCls}
                      >
                        <option value="left">Gauche</option>
                        <option value="center">Centre</option>
                        <option value="right">Droite</option>
                      </select>
                      <button
                        onClick={() => void deleteButton(b.id)}
                        className="ml-auto rounded-xl border border-rose-400/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {(buttons[pageSlug] ?? []).length === 0 && (
                  <p className="text-sm text-white/50">Aucun bouton sur cette page pour le moment.</p>
                )}
              </div>
            </div>
          ) : tab === "maintenance" ? (
            <div className="grid max-w-2xl gap-5">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div>
                  <p className="text-sm font-semibold text-white">Mode maintenance</p>
                  <p className="text-xs text-white/50">
                    Quand il est activé, seuls les super admins et les utilisateurs autorisés ci-dessous voient le
                    site. Les autres visiteurs ne voient que l'écran de maintenance.
                  </p>
                </div>
                <button
                  onClick={() => void patchMaintenance({ enabled: !maintenance.enabled })}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    maintenance.enabled
                      ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
                      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  }`}
                >
                  {maintenance.enabled ? "Activé" : "Désactivé"}
                </button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">Titre</span>
                <input
                  value={maintenance.title}
                  onChange={(e) => setMaintenance((p) => ({ ...p, title: e.target.value }))}
                  onBlur={() => void patchMaintenance({})}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Sous-titre
                </span>
                <input
                  value={maintenance.subtitle}
                  onChange={(e) => setMaintenance((p) => ({ ...p, subtitle: e.target.value }))}
                  onBlur={() => void patchMaintenance({})}
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Fin du compte à rebours
                </span>
                <input
                  type="datetime-local"
                  value={maintenance.targetAt ? maintenance.targetAt.slice(0, 16) : ""}
                  onChange={(e) =>
                    void patchMaintenance({
                      targetAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className={inputCls}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">Image de fond</p>
                  <div className="mb-3 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {maintenance.backgroundUrl ? (
                      <img src={maintenance.backgroundUrl} alt="Fond maintenance" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/35">Aucune image</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="btn-gradient inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5" /> Téléverser
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadMaintenance("backgroundUrl", file);
                        }}
                      />
                    </label>
                    {maintenance.backgroundUrl && (
                      <button onClick={() => void patchMaintenance({ backgroundUrl: null })} className={btnCls}>
                        Retirer
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">Logo</p>
                  <div className="mb-3 grid aspect-video place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {maintenance.logoUrl ? (
                      <img
                        src={maintenance.logoUrl}
                        alt="Logo maintenance"
                        style={{ height: `${maintenance.logoSize}px` }}
                        className="w-auto object-contain"
                      />
                    ) : (
                      <span className="text-xs text-white/35">Aucun logo</span>
                    )}
                  </div>
                  <div className="mb-3 flex gap-2">
                    <label className="btn-gradient inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5" /> Téléverser
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadMaintenance("logoUrl", file);
                        }}
                      />
                    </label>
                    {maintenance.logoUrl && (
                      <button onClick={() => void patchMaintenance({ logoUrl: null })} className={btnCls}>
                        Retirer
                      </button>
                    )}
                  </div>
                  <label className="block text-[11px] text-white/50">
                    Taille du logo — {maintenance.logoSize} px
                    <input
                      type="range"
                      min={32}
                      max={240}
                      step={4}
                      value={maintenance.logoSize}
                      onChange={(e) => setMaintenance((p) => ({ ...p, logoSize: Number(e.target.value) }))}
                      onMouseUp={() => void patchMaintenance({})}
                      onTouchEnd={() => void patchMaintenance({})}
                      className="mt-1 w-full"
                    />
                  </label>
                </div>
              </div>

              <MaintenanceAccess />

              {snapshots.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                    Sauvegardes récentes
                  </p>
                  <div className="space-y-1">
                    {snapshots.map((s) => (
                      <div key={s.at} className="flex items-center justify-between gap-3 text-xs text-white/60">
                        <span>{new Date(s.at).toLocaleString("fr-FR")}</span>
                        <button onClick={() => void restoreSnapshot(s)} className={btnCls}>
                          <History className="h-3.5 w-3.5" /> Restaurer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : tab === "partners" ? (

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-white/50">
                  Ces logos défilent sur la page d'accueil, sous les boutons « Découvrir » et « Nous contacter ».
                </p>
                <button onClick={() => void addPartner()} className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Ajouter un partenaire
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {partners.map((p, i) => (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          <span className="text-[10px] text-white/35">Sans logo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          value={p.name}
                          onChange={(e) => void updatePartner(p.id, { name: e.target.value })}
                          placeholder="Nom de l'entreprise"
                          className={inputCls}
                        />
                        <input
                          value={p.website_url ?? ""}
                          onChange={(e) => void updatePartner(p.id, { website_url: e.target.value })}
                          placeholder="https://site-web.com"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="btn-gradient inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                        <Upload className="h-3.5 w-3.5" /> Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadPartnerLogo(p.id, file);
                          }}
                        />
                      </label>
                      <button onClick={() => void movePartner(i, -1)} disabled={i === 0} className={`${btnCls} disabled:opacity-30`}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void movePartner(i, 1)}
                        disabled={i === partners.length - 1}
                        className={`${btnCls} disabled:opacity-30`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void deletePartner(p.id)}
                        className="ml-auto rounded-xl border border-rose-400/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === "ai" ? (
            <div className="grid max-w-3xl gap-4">
              <p className="text-xs text-white/50">
                Décrivez en langage naturel ce que vous voulez changer sur la page <strong>{pageName}</strong> (textes,
                couleurs, tailles, position, partenaires, pages, typographie). L'IA applique les modifications
                directement.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                placeholder="Ex : rends le titre du hero plus percutant, en majuscules et centré, et ajoute un partenaire nommé Orange"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  "Réécris tous les textes de cette page de façon plus percutante",
                  "Mets le titre principal en majuscules, centré et en violet",
                  "Ajoute un texte libre « Offre de lancement -20% »",
                  "Passe la police des titres en Poppins",
                ].map((s) => (
                  <button key={s} onClick={() => setAiPrompt(s)} className={chipCls}>
                    {s}
                  </button>
                ))}
              </div>
              <div>
                <button
                  onClick={askAi}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-60"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? "L'IA travaille…" : "Générer et appliquer"}
                </button>
              </div>
              {aiResult && (
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-4">
                  <p className="text-sm font-semibold text-emerald-200">{aiResult.summary}</p>
                  <ul className="mt-2 space-y-1 text-xs text-white/70">
                    {aiResult.applied.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                    {aiResult.applied.length === 0 && <li>Aucune modification appliquée.</li>}
                  </ul>
                </div>
              )}
            </div>
          ) : tab === "files" ? (
            <div>
              <p className="mb-4 text-xs text-white/50">
                Explorateur des fichiers du projet : créez, renommez, supprimez des fichiers, dossiers et images, et
                modifiez directement le code.
              </p>
              <FileExplorer />
            </div>
          ) : tab === "typo" ? (
            <div className="grid max-w-xl gap-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Police des titres
                </span>
                <select
                  value={typo.fontDisplay}
                  onChange={(e) => {
                    setSaved(false);
                    setTypo((p) => ({ ...p, fontDisplay: e.target.value }));
                  }}
                  className={inputCls}
                >
                  {FONT_CHOICES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Police des textes
                </span>
                <select
                  value={typo.fontBody}
                  onChange={(e) => {
                    setSaved(false);
                    setTypo((p) => ({ ...p, fontBody: e.target.value }));
                  }}
                  className={inputCls}
                >
                  {FONT_CHOICES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Taille générale du texte — {Math.round(typo.scale * 100)} %
                </span>
                <input
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={typo.scale}
                  onChange={(e) => {
                    setSaved(false);
                    setTypo((p) => ({ ...p, scale: Number(e.target.value) }));
                  }}
                  className="w-full"
                />
              </label>
              <p className="text-xs text-white/45">
                Ces réglages s'appliquent à tout le site public. Cliquez sur « Enregistrer » pour les publier.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-white/50">
                  Mode avancé : éditez directement le JSON des textes et des styles de la page {pageName}.
                </p>
                <button onClick={applyCode} className={btnCls}>
                  Appliquer le code
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                rows={26}
                className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-emerald-200 outline-none"
              />
              <p className="mt-2 text-[11px] text-white/40">
                Après « Appliquer le code », cliquez sur « Enregistrer » pour publier les modifications.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
