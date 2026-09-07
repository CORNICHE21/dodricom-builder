import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PurchaseLine = {
  designation: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total: number;
};

export type PurchaseExtraction = {
  supplier_name: string;
  supplier_ice: string;
  reference: string;
  issue_date: string;
  due_date: string;
  description: string;
  total_ht: number;
  vat_rate: number;
  total_vat: number;
  total_ttc: number;
  lines: PurchaseLine[];
};

export const ZONE_FIELDS = [
  { key: "document", label: "Document entier" },
  { key: "societe", label: "Nom de société" },
  { key: "numero", label: "N° du document" },
  { key: "date", label: "Date" },
  { key: "articles", label: "Articles / lignes" },
  { key: "totaux", label: "Totaux & TVA" },
] as const;

export type ZoneField = (typeof ZONE_FIELDS)[number]["key"];

const SYSTEM = `Tu es un assistant comptable marocain. Tu lis des factures d'achat (images) et tu extrais les données.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"supplier_name":"","supplier_ice":"","reference":"","issue_date":"YYYY-MM-DD","due_date":"","description":"","total_ht":0,"vat_rate":20,"total_vat":0,"total_ttc":0,"lines":[{"designation":"","unit_price":0,"quantity":1,"unit":"U","total":0}]}
Règles : nombres sans espace ni devise (point décimal). Champ inconnu = "" ou 0. Dates au format YYYY-MM-DD.
Si des zones sont fournies avec un libellé, elles indiquent où trouver l'information correspondante.`;

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const extractPurchaseDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { parts: { field: string; image: string }[]; note?: string }) => {
    const parts = (input?.parts ?? []).filter((p) => p?.image?.startsWith("data:image")).slice(0, 8);
    if (!parts.length) throw new Error("Aucune image à analyser.");
    return { parts, note: String(input?.note ?? "").slice(0, 500) };
  })
  .handler(async ({ data }): Promise<PurchaseExtraction> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponible : clé manquante.");

    const content: unknown[] = [
      {
        type: "text",
        text:
          `Extrais les données de cette facture d'achat.` +
          (data.note ? ` Précision : ${data.note}.` : "") +
          ` Zones fournies : ${data.parts.map((p) => p.field).join(", ")}.`,
      },
    ];
    for (const p of data.parts) {
      content.push({ type: "text", text: `Zone « ${p.field} » :` });
      content.push({ type: "image_url", image_url: { url: p.image } });
    }

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
          { role: "user", content },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Trop de requêtes IA, réessayez dans un instant.");
    if (res.status === 402) throw new Error("Crédits IA épuisés.");
    if (!res.ok) throw new Error(`Erreur IA (${res.status}) : ${(await res.text()).slice(0, 200)}`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("L'IA n'a pas pu lire le document.");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      throw new Error("Réponse IA illisible.");
    }

    const lines = Array.isArray(parsed["lines"])
      ? (parsed["lines"] as Record<string, unknown>[]).map((l) => {
          const unit_price = num(l["unit_price"]);
          const quantity = num(l["quantity"]) || 1;
          return {
            designation: str(l["designation"]),
            unit_price,
            quantity,
            unit: str(l["unit"]) || "U",
            total: num(l["total"]) || unit_price * quantity,
          };
        })
      : [];

    const total_ht = num(parsed["total_ht"]) || lines.reduce((s, l) => s + l.total, 0);
    const vat_rate = num(parsed["vat_rate"]) || 20;
    const total_vat = num(parsed["total_vat"]) || (total_ht * vat_rate) / 100;

    return {
      supplier_name: str(parsed["supplier_name"]),
      supplier_ice: str(parsed["supplier_ice"]),
      reference: str(parsed["reference"]),
      issue_date: /^\d{4}-\d{2}-\d{2}$/.test(str(parsed["issue_date"]))
        ? str(parsed["issue_date"])
        : new Date().toISOString().slice(0, 10),
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(str(parsed["due_date"])) ? str(parsed["due_date"]) : "",
      description: str(parsed["description"]),
      total_ht,
      vat_rate,
      total_vat,
      total_ttc: num(parsed["total_ttc"]) || total_ht + total_vat,
      lines,
    };
  });
