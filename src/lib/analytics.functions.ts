import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VisitorStats = {
  online: number;
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
  sessionsMonth: number;
  byDay: { label: string; visites: number; visiteurs: number }[];
  byMonth: { label: string; visites: number; visiteurs: number }[];
  byCountry: { name: string; value: number }[];
  byDevice: { name: string; value: number }[];
  topPages: { path: string; value: number }[];
  live: { path: string; country: string | null; city: string | null; at: string }[];
};

const deviceFrom = (ua: string) => {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablette";
  if (/mobi|iphone|android/.test(s)) return "Mobile";
  return "Ordinateur";
};

/** Enregistre une visite (appelé depuis le site public, sans authentification). */
export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string; path: string; referrer?: string }) => ({
    sessionId: String(input?.sessionId ?? "").slice(0, 64),
    path: String(input?.path ?? "/").slice(0, 300),
    referrer: String(input?.referrer ?? "").slice(0, 300),
  }))
  .handler(async ({ data }) => {
    if (!data.sessionId) return { ok: false };
    const ua = getRequestHeader("user-agent") ?? "";
    const country = getRequestHeader("cf-ipcountry") ?? null;
    const city = getRequestHeader("cf-ipcity") ?? null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("site_visits").insert({
      session_id: data.sessionId,
      path: data.path,
      referrer: data.referrer || null,
      country: country && country !== "XX" ? country : null,
      city,
      device: deviceFrom(ua),
      user_agent: ua.slice(0, 400),
    });
    return { ok: true };
  });

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const COUNTRY_NAMES: Record<string, string> = {
  MA: "Maroc",
  FR: "France",
  ES: "Espagne",
  US: "États-Unis",
  BE: "Belgique",
  CA: "Canada",
  DE: "Allemagne",
  IT: "Italie",
  GB: "Royaume-Uni",
  NL: "Pays-Bas",
  DZ: "Algérie",
  TN: "Tunisie",
  SA: "Arabie saoudite",
  AE: "Émirats arabes unis",
};
export const countryName = (code: string) => COUNTRY_NAMES[code] ?? code;

/** Statistiques de fréquentation pour le back-office. */
export const getVisitorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VisitorStats> => {
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, 0, 1).toISOString();
    const { data } = await context.supabase
      .from("site_visits")
      .select("session_id, path, country, city, device, created_at")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(50000);

    const rows = data ?? [];
    const t = now.getTime();
    const since = (ms: number) => rows.filter((r) => t - new Date(r.created_at).getTime() <= ms);
    const uniq = (list: typeof rows) => new Set(list.map((r) => r.session_id)).size;

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const at = (r: (typeof rows)[number]) => new Date(r.created_at).getTime();

    const monthRows = rows.filter((r) => at(r) >= startOfMonth);

    const byDay: VisitorStats["byDay"] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = d.getTime() + 86400000;
      const list = rows.filter((r) => at(r) >= d.getTime() && at(r) < next);
      byDay.push({
        label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        visites: list.length,
        visiteurs: uniq(list),
      });
    }

    const byMonth: VisitorStats["byMonth"] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const list = rows.filter((r) => at(r) >= d.getTime() && at(r) < next);
      byMonth.push({
        label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        visites: list.length,
        visiteurs: uniq(list),
      });
    }

    const count = <T extends string>(list: T[]) => {
      const m = new Map<T, number>();
      for (const v of list) m.set(v, (m.get(v) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      online: uniq(since(5 * 60 * 1000)),
      today: rows.filter((r) => at(r) >= startOfDay).length,
      week: since(7 * 86400000).length,
      month: monthRows.length,
      year: rows.filter((r) => at(r) >= startOfYear).length,
      total: rows.length,
      sessionsMonth: uniq(monthRows),
      byDay,
      byMonth,
      byCountry: count(rows.map((r) => countryName(r.country ?? "Inconnu")))
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
      byDevice: count(rows.map((r) => r.device ?? "Inconnu")).map(([name, value]) => ({ name, value })),
      topPages: count(rows.map((r) => r.path))
        .slice(0, 8)
        .map(([path, value]) => ({ path, value })),
      live: since(5 * 60 * 1000)
        .slice(0, 8)
        .map((r) => ({ path: r.path, country: r.country, city: r.city, at: r.created_at })),
    };
  });

export type OpsStats = {
  caTtc: number;
  encaisse: number;
  restant: number;
  docs: number;
  devis: number;
  factures: number;
  achatsTtc: number;
  commandes: number;
  commandesNouvelles: number;
  messagesNouveaux: number;
  caByMonth: { label: string; ca: number; encaisse: number }[];
  recent: { label: string; sub: string; at: string; tone: string }[];
};

/** Indicateurs opérationnels réels (facturation, achats, commandes, messages). */
export const getOpsStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OpsStats> => {
    const sb = context.supabase;
    const [docsRes, paysRes, buyRes, ordersRes, msgRes] = await Promise.all([
      sb.from("billing_documents").select("id, doc_type, number, client_name, total_ttc, issue_date, created_at"),
      sb.from("billing_payments").select("amount, paid_at"),
      sb.from("supplier_invoices").select("total_ttc, issue_date, status"),
      sb.from("orders").select("id, number, total, status, created_at").order("created_at", { ascending: false }).limit(20),
      sb.from("contact_messages").select("id, full_name, subject, status, created_at").order("created_at", { ascending: false }).limit(20),
    ]);

    const docs = docsRes.data ?? [];
    const pays = paysRes.data ?? [];
    const buys = buyRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const msgs = msgRes.data ?? [];

    const sales = docs.filter((d) => d.doc_type === "facture" || d.doc_type === "facture_acompte");
    const caTtc = sales.reduce((s, d) => s + Number(d.total_ttc || 0), 0);
    const encaisse = pays.reduce((s, p) => s + Number(p.amount || 0), 0);

    const now = new Date();
    const caByMonth: OpsStats["caByMonth"] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const inM = (iso: string | null) => {
        if (!iso) return false;
        const x = new Date(iso).getTime();
        return x >= d.getTime() && x < next.getTime();
      };
      caByMonth.push({
        label: `${MONTHS[d.getMonth()]}`,
        ca: sales.filter((s) => inM(s.issue_date)).reduce((s, x) => s + Number(x.total_ttc || 0), 0),
        encaisse: pays.filter((p) => inM(p.paid_at)).reduce((s, x) => s + Number(x.amount || 0), 0),
      });
    }

    const recent = [
      ...docs.slice(0, 10).map((d) => ({
        label: `${d.doc_type === "devis" ? "Devis" : "Document"} ${d.number} — ${d.client_name}`,
        sub: `${Number(d.total_ttc || 0).toFixed(2)} MAD`,
        at: d.created_at,
        tone: "violet",
      })),
      ...orders.map((o) => ({
        label: `Commande ${o.number}`,
        sub: `${Number(o.total || 0).toFixed(2)} MAD — ${o.status}`,
        at: o.created_at,
        tone: "blue",
      })),
      ...msgs.map((m) => ({
        label: `Message — ${m.full_name}`,
        sub: m.subject ?? "Sans objet",
        at: m.created_at,
        tone: "cyan",
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);

    return {
      caTtc,
      encaisse,
      restant: Math.max(0, caTtc - encaisse),
      docs: docs.length,
      devis: docs.filter((d) => d.doc_type === "devis").length,
      factures: sales.length,
      achatsTtc: buys.reduce((s, b) => s + Number(b.total_ttc || 0), 0),
      commandes: orders.length,
      commandesNouvelles: orders.filter((o) => o.status === "nouvelle").length,
      messagesNouveaux: msgs.filter((m) => m.status === "new").length,
      caByMonth,
      recent,
    };
  });
