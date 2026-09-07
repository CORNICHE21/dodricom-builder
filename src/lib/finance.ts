/**
 * Module Finance & Comptabilité — types, constantes et calculs purs.
 * Aucun appel réseau ici : uniquement des types et des fonctions de calcul testables.
 * Les libellés sont en français ; la structure permet d'ajouter FR / EN / AR plus tard
 * (voir `L` ci-dessous : dictionnaire unique de libellés).
 */

import type { BillingDoc, Payment } from "@/lib/billing";

/* ------------------------------------------------------------------ types */

export type PosLocation = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AccountType = "banque" | "caisse" | "compte_bancaire" | "carte_bancaire";

export type FinancialAccount = {
  id: string;
  name: string;
  account_type: AccountType;
  bank_name: string | null;
  iban: string | null;
  rib: string | null;
  currency: string;
  opening_balance: number;
  is_active: boolean;
  pos_id: string | null;
  accounting_account: string | null;
  notes: string | null;
};

export type TxType =
  | "encaissement"
  | "decaissement"
  | "virement"
  | "depot"
  | "retrait"
  | "autre";

export type FinancialTransaction = {
  id: string;
  tx_date: string;
  tx_type: TxType;
  account_id: string | null;
  target_account_id: string | null;
  party_type: string | null;
  party_name: string | null;
  supplier_id: string | null;
  billing_document_id: string | null;
  supplier_invoice_id: string | null;
  expense_id: string | null;
  pos_id: string | null;
  reference: string | null;
  label: string;
  amount: number;
  payment_method: string;
  attachment_url: string | null;
  is_reconciled: boolean;
  comment: string | null;
  created_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  ice: string | null;
  if_number: string | null;
  rc: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  rib: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
};

export type SupplierInvoice = {
  id: string;
  supplier_id: string | null;
  doc_type: string;
  reference: string;
  issue_date: string;
  due_date: string | null;
  description: string | null;
  total_ht: number;
  vat_rate: number;
  total_vat: number;
  total_ttc: number;
  status: string;
  pos_id: string | null;
  attachment_url: string | null;
  notes: string | null;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  accounting_account: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Expense = {
  id: string;
  expense_date: string;
  category_id: string | null;
  supplier_id: string | null;
  supplier_invoice_id: string | null;
  description: string;
  amount_ht: number;
  vat_rate: number;
  vat_amount: number;
  amount_ttc: number;
  account_id: string | null;
  payment_method: string;
  pos_id: string | null;
  receipt_url: string | null;
  notes: string | null;
};

export type TaxRate = {
  id: string;
  label: string;
  rate: number;
  is_default: boolean;
  is_active: boolean;
};

export type AccountingAccount = {
  id: string;
  code: string;
  label: string;
  account_type: string;
  parent_code: string | null;
  is_active: boolean;
};

export type AccountingJournal = {
  id: string;
  code: string;
  label: string;
  journal_type: string;
  is_active: boolean;
};

export type FiscalPeriod = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
};

export type AccountingEntry = {
  id: string;
  entry_date: string;
  journal_code: string;
  piece_number: string | null;
  label: string;
  party_name: string | null;
  source_type: string | null;
  source_id: string | null;
  pos_id: string | null;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
};

export type AccountingEntryLine = {
  id: string;
  entry_id: string;
  account_code: string;
  label: string;
  debit: number;
  credit: number;
  sort_order: number;
};

export type FinanceSettings = {
  id: string;
  currency: string;
  default_vat: number;
  account_client: string;
  account_supplier: string;
  account_sales: string;
  account_vat_collected: string;
  account_vat_deductible: string;
  account_bank: string;
  account_cash: string;
  account_expense_default: string;
  low_cash_threshold: number;
  low_bank_threshold: number;
};

/* -------------------------------------------------------------- constantes */

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "banque", label: "Banque" },
  { value: "caisse", label: "Caisse" },
  { value: "compte_bancaire", label: "Compte bancaire" },
  { value: "carte_bancaire", label: "Carte bancaire" },
];

export const CASH_TYPES: AccountType[] = ["caisse"];

export const TX_TYPES: { value: TxType; label: string; sign: 1 | -1 | 0 }[] = [
  { value: "encaissement", label: "Encaissement", sign: 1 },
  { value: "decaissement", label: "Décaissement", sign: -1 },
  { value: "virement", label: "Virement", sign: 0 },
  { value: "depot", label: "Dépôt", sign: 1 },
  { value: "retrait", label: "Retrait", sign: -1 },
  { value: "autre", label: "Autre opération", sign: 1 },
];

export const FIN_PAYMENT_METHODS = [
  "espèces",
  "carte bancaire",
  "virement",
  "chèque",
  "effet",
  "autre",
] as const;

export const SUPPLIER_DOC_TYPES = [
  { value: "bon_commande_fournisseur", label: "Bon de commande" },
  { value: "reception", label: "Réception" },
  { value: "facture_fournisseur", label: "Facture fournisseur" },
  { value: "avoir_fournisseur", label: "Avoir fournisseur" },
];

export const SUPPLIER_STATUSES = [
  { value: "brouillon", label: "Brouillon", cls: "bg-white/10 text-white/70" },
  { value: "valide", label: "Validée", cls: "bg-sky-400/15 text-sky-200" },
  { value: "partiel", label: "Payée partiellement", cls: "bg-amber-400/15 text-amber-200" },
  { value: "paye", label: "Payée", cls: "bg-emerald-400/15 text-emerald-200" },
  { value: "annule", label: "Annulée", cls: "bg-rose-400/15 text-rose-200" },
];

/** Permissions fines du module (RBAC — voir `useFinancePerm`). */
export type FinancePermission =
  | "finance.view"
  | "finance.create"
  | "finance.edit"
  | "finance.delete"
  | "finance.export"
  | "compta.view"
  | "compta.create"
  | "compta.edit"
  | "compta.delete"
  | "compta.close"
  | "treasury.view"
  | "treasury.create"
  | "treasury.edit"
  | "reports.view"
  | "reports.export";

/** Dictionnaire de libellés — point d'entrée unique pour la future i18n FR/EN/AR. */
export const L = {
  currency: "MAD",
  noData: "Aucune donnée disponible",
} as const;

/* ---------------------------------------------------------------- périodes */

export type PeriodKey =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

export const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
  { value: "custom", label: "Période personnalisée" },
];

export type Range = { from: string; to: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function periodRange(key: PeriodKey, custom?: Partial<Range>, now = new Date()): Range {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":
      return { from: iso(d), to: iso(d) };
    case "week": {
      const day = (d.getDay() + 6) % 7; // lundi = 0
      const start = new Date(d);
      start.setDate(d.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: iso(start), to: iso(end) };
    }
    case "month":
      return {
        from: iso(new Date(d.getFullYear(), d.getMonth(), 1)),
        to: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      };
    case "quarter": {
      const q = Math.floor(d.getMonth() / 3);
      return {
        from: iso(new Date(d.getFullYear(), q * 3, 1)),
        to: iso(new Date(d.getFullYear(), q * 3 + 3, 0)),
      };
    }
    case "year":
      return {
        from: iso(new Date(d.getFullYear(), 0, 1)),
        to: iso(new Date(d.getFullYear(), 11, 31)),
      };
    case "custom":
    default:
      return {
        from: custom?.from || iso(new Date(d.getFullYear(), 0, 1)),
        to: custom?.to || iso(d),
      };
  }
}

export function inRange(date: string | null | undefined, r: Range) {
  if (!date) return false;
  const v = date.slice(0, 10);
  return v >= r.from && v <= r.to;
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const names = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${names[Number(m) - 1] ?? m} ${String(y).slice(2)}`;
}

export function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000,
  );
}

export const todayIso = () => iso(new Date());

/* ------------------------------------------------------------- calculs CA */

/** Types de documents de facturation considérés comme du chiffre d'affaires. */
export const SALES_DOC_TYPES = ["facture", "facture_acompte", "recu"];

export function isSalesDoc(d: BillingDoc) {
  return SALES_DOC_TYPES.includes(d.doc_type) && d.status !== "annule";
}

export function isCreditNote(d: BillingDoc) {
  return d.doc_type === "avoir" && d.status !== "annule";
}

export function paidOf(docId: string, payments: Payment[]) {
  return payments
    .filter((p) => p.document_id === docId)
    .reduce((s, p) => s + Number(p.amount || 0), 0);
}

export type SalesRow = {
  doc: BillingDoc;
  paid: number;
  remaining: number;
  overdue: boolean;
  computedStatus: "paye" | "partiel" | "impaye" | "echue" | "annule";
};

export function buildSalesRows(
  docs: BillingDoc[],
  payments: Payment[],
  today = todayIso(),
): SalesRow[] {
  return docs.map((doc) => {
    const paid = paidOf(doc.id, payments);
    const remaining = Math.max(0, Number(doc.total_ttc || 0) - paid);
    const overdue = Boolean(doc.due_date && doc.due_date < today && remaining > 0.005);
    let computedStatus: SalesRow["computedStatus"];
    if (doc.status === "annule") computedStatus = "annule";
    else if (remaining <= 0.005 && Number(doc.total_ttc) > 0) computedStatus = "paye";
    else if (paid > 0.005) computedStatus = "partiel";
    else if (overdue) computedStatus = "echue";
    else computedStatus = "impaye";
    return { doc, paid, remaining, overdue, computedStatus };
  });
}

export const SALES_STATUS_META: Record<
  SalesRow["computedStatus"],
  { label: string; cls: string }
> = {
  paye: { label: "Payée", cls: "bg-emerald-400/15 text-emerald-200" },
  partiel: { label: "Partielle", cls: "bg-amber-400/15 text-amber-200" },
  impaye: { label: "Impayée", cls: "bg-white/10 text-white/70" },
  echue: { label: "Échue", cls: "bg-rose-400/15 text-rose-200" },
  annule: { label: "Annulée", cls: "bg-rose-400/10 text-rose-300/70" },
};

/* ------------------------------------------------------------- trésorerie */

/** Impact d'une opération sur un compte donné (positif = entrée). */
export function txImpact(tx: FinancialTransaction, accountId: string): number {
  const amount = Number(tx.amount || 0);
  if (tx.tx_type === "virement") {
    if (tx.account_id === accountId) return -amount;
    if (tx.target_account_id === accountId) return amount;
    return 0;
  }
  if (tx.account_id !== accountId) return 0;
  const sign = TX_TYPES.find((t) => t.value === tx.tx_type)?.sign ?? 1;
  return amount * sign;
}

export function accountBalance(
  account: FinancialAccount,
  txs: FinancialTransaction[],
): number {
  return txs.reduce(
    (s, tx) => s + txImpact(tx, account.id),
    Number(account.opening_balance || 0),
  );
}

/* --------------------------------------------------------------- aging */

export type AgingBuckets = { b030: number; b3160: number; b6190: number; b90: number };

export function agingFor(rows: SalesRow[], today = todayIso()): AgingBuckets {
  const out: AgingBuckets = { b030: 0, b3160: 0, b6190: 0, b90: 0 };
  for (const r of rows) {
    if (r.remaining <= 0.005 || r.computedStatus === "annule") continue;
    const base = r.doc.due_date || r.doc.issue_date;
    const age = daysBetween(base, today);
    if (age <= 30) out.b030 += r.remaining;
    else if (age <= 60) out.b3160 += r.remaining;
    else if (age <= 90) out.b6190 += r.remaining;
    else out.b90 += r.remaining;
  }
  return out;
}

/* ------------------------------------------------------- écritures compta */

export function entryBalanced(lines: { debit: number; credit: number }[]) {
  const d = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const c = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  return { debit: d, credit: c, balanced: Math.abs(d - c) < 0.005 };
}

/* ------------------------------------------------------------------ divers */

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
