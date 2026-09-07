/** Module Facturation — types, helpers de calcul, numérotation et montant en lettres. */

export type DocType =
  | "devis"
  | "bon_commande"
  | "facture"
  | "facture_acompte"
  | "avoir"
  | "bon_livraison"
  | "recu";

export const DOC_TYPES: { value: DocType; label: string; prefix: string; title: string }[] = [
  { value: "devis", label: "Devis", prefix: "DV", title: "Devis" },
  { value: "bon_commande", label: "Bon de commande", prefix: "BC", title: "Bon de commande" },
  { value: "facture", label: "Facture", prefix: "FA", title: "Facture" },
  { value: "facture_acompte", label: "Facture d'acompte", prefix: "FAC", title: "Facture d'acompte" },
  { value: "avoir", label: "Avoir", prefix: "AV", title: "Avoir" },
  { value: "bon_livraison", label: "Bon de livraison", prefix: "BL", title: "Bon de livraison" },
  { value: "recu", label: "Reçu", prefix: "RC", title: "Reçu" },
];

export function docLabel(t: string) {
  return DOC_TYPES.find((d) => d.value === t)?.label ?? t;
}
export function docTitle(t: string) {
  return DOC_TYPES.find((d) => d.value === t)?.title ?? t;
}
export function docPrefix(t: string) {
  return DOC_TYPES.find((d) => d.value === t)?.prefix ?? "DOC";
}

export type DocStatus = "brouillon" | "envoye" | "partiel" | "paye" | "annule";

export const STATUSES: { value: DocStatus; label: string; cls: string }[] = [
  { value: "brouillon", label: "Brouillon", cls: "bg-white/10 text-white/70" },
  { value: "envoye", label: "Envoyé", cls: "bg-sky-400/15 text-sky-200" },
  { value: "partiel", label: "Payé partiellement", cls: "bg-amber-400/15 text-amber-200" },
  { value: "paye", label: "Payé", cls: "bg-emerald-400/15 text-emerald-200" },
  { value: "annule", label: "Annulé", cls: "bg-rose-400/15 text-rose-200" },
];

export const PAYMENT_METHODS = ["chèque", "virement", "espèces", "carte", "effet"] as const;

export type DocLine = {
  id?: string;
  section: string;
  designation: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total: number;
  sort_order: number;
};

export type BillingDoc = {
  id: string;
  doc_type: DocType;
  number: string;
  status: DocStatus;
  client_name: string;
  client_address: string | null;
  client_ice: string | null;
  client_email: string | null;
  client_phone: string | null;
  order_ref: string | null;
  city: string | null;
  issue_date: string;
  due_date: string | null;
  intro_text: string | null;
  vat_rate: number;
  discount: number;
  deposit: number;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  net_to_pay: number;
  terms: string | null;
  notes: string | null;
  source_document_id: string | null;
  created_at: string;
};

export type BillingSettings = {
  id: string;
  company_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  ice: string | null;
  rc: string | null;
  if_number: string | null;
  patente: string | null;
  rib: string | null;
  capital: string | null;
  logo_url: string | null;
  letterhead_url: string | null;
  stamp_url: string | null;
  default_vat: number;
  currency: string;
  terms: string | null;
};

export type Payment = {
  id: string;
  document_id: string;
  paid_at: string;
  amount: number;
  method: string;
  reference: string | null;
  note: string | null;
};

export function computeTotals(
  lines: DocLine[],
  vatRate: number,
  discount: number,
  deposit: number,
) {
  const gross = lines.reduce((s, l) => s + Number(l.unit_price || 0) * Number(l.quantity || 0), 0);
  const totalHt = Math.max(0, gross - Number(discount || 0));
  const totalVat = (totalHt * Number(vatRate || 0)) / 100;
  const totalTtc = totalHt + totalVat;
  const netToPay = Math.max(0, totalTtc - Number(deposit || 0));
  return { gross, totalHt, totalVat, totalTtc, netToPay };
}

export function money(n: number, currency = "MAD") {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0),
  )} ${currency}`;
}

export function nextNumber(type: DocType, existing: string[], date = new Date()) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const base = `${docPrefix(type)}${yy}${mm}`;
  const nums = existing
    .filter((n) => n.startsWith(base))
    .map((n) => Number(n.slice(base.length)) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${base}${String(next).padStart(4, "0")}`;
}

const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function belowHundred(n: number): string {
  if (n < 20) return UNITS[n]!;
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    const rest = belowHundred(10 + u);
    return `${TENS[t]}-${rest}`;
  }
  if (u === 0) return t === 8 ? "quatre-vingts" : TENS[t]!;
  if (u === 1 && t !== 8) return `${TENS[t]} et un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 0) return belowHundred(r);
  const head = h === 1 ? "cent" : `${UNITS[h]} cent`;
  if (r === 0) return h === 1 ? "cent" : `${head}s`;
  return `${head} ${belowHundred(r)}`;
}

/** Convertit un entier en toutes lettres (français). */
export function numberToWordsFr(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "zéro";
  const parts: string[] = [];
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (billions) parts.push(`${belowThousand(billions)} milliard${billions > 1 ? "s" : ""}`);
  if (millions) parts.push(`${belowThousand(millions)} million${millions > 1 ? "s" : ""}`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${belowThousand(thousands)} mille`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** "quatre mille cinq cents dirhams" (avec centimes si nécessaire). */
export function amountInWords(value: number, currency = "MAD") {
  const unit = currency === "MAD" ? "dirhams" : currency;
  const int = Math.floor(Math.abs(value));
  const cents = Math.round((Math.abs(value) - int) * 100);
  const head = `${numberToWordsFr(int)} ${unit}`;
  return cents ? `${head} et ${numberToWordsFr(cents)} centimes` : head;
}

export function formatDateFr(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  const s = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
