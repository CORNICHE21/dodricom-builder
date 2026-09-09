/**
 * Journalisation automatique : transforme chaque mouvement (vente, encaissement,
 * achat, dépense, salaire, banque/caisse) en écriture comptable équilibrée.
 * Fonctions pures : aucun appel réseau ici.
 */
import type { FinanceDataset } from "@/lib/finance-data";
import type { BillingDoc, Payment } from "@/lib/billing";
import {
  isCreditNote,
  isSalesDoc,
  num,
  type Expense,
  type FinancialAccount,
  type FinancialTransaction,
  type SupplierInvoice,
} from "@/lib/finance";

export type DerivedLine = {
  account_code: string;
  label: string;
  debit: number;
  credit: number;
};

export type DerivedEntry = {
  source_type: string;
  source_id: string;
  entry_date: string;
  journal_code: string;
  piece_number: string | null;
  label: string;
  party_name: string | null;
  pos_id: string | null;
  lines: DerivedLine[];
};

const DEFAULTS = {
  currency: "MAD",
  account_client: "3421",
  account_supplier: "4411",
  account_sales: "7121",
  account_vat_collected: "4455",
  account_vat_deductible: "3455",
  account_bank: "5141",
  account_cash: "5161",
  account_expense_default: "6188",
  account_payroll: "6171",
  account_purchases: "6121",
};

export type Mapping = typeof DEFAULTS;

export function mappingOf(data: FinanceDataset): Mapping {
  const s = data.settings;
  if (!s) return { ...DEFAULTS };
  return {
    ...DEFAULTS,
    currency: s.currency || DEFAULTS.currency,
    account_client: s.account_client || DEFAULTS.account_client,
    account_supplier: s.account_supplier || DEFAULTS.account_supplier,
    account_sales: s.account_sales || DEFAULTS.account_sales,
    account_vat_collected: s.account_vat_collected || DEFAULTS.account_vat_collected,
    account_vat_deductible: s.account_vat_deductible || DEFAULTS.account_vat_deductible,
    account_bank: s.account_bank || DEFAULTS.account_bank,
    account_cash: s.account_cash || DEFAULTS.account_cash,
    account_expense_default: s.account_expense_default || DEFAULTS.account_expense_default,
  };
}

const isCashMethod = (m: string | null | undefined) =>
  (m ?? "").toLowerCase().includes("espèce") || (m ?? "").toLowerCase().includes("espece");

const looksPayroll = (text: string | null | undefined) => {
  const t = (text ?? "").toLowerCase();
  return (
    t.includes("salaire") ||
    t.includes("salaires") ||
    t.includes("paie") ||
    t.includes("paye du personnel") ||
    t.includes("rémunération") ||
    t.includes("remuneration") ||
    t.includes("personnel")
  );
};

/** Compte comptable d'un compte bancaire / caisse. */
export function treasuryAccountCode(
  acc: FinancialAccount | undefined,
  m: Mapping,
  method?: string | null,
): string {
  if (acc) {
    if (acc.accounting_account) return acc.accounting_account;
    return acc.account_type === "caisse" ? m.account_cash : m.account_bank;
  }
  return isCashMethod(method) ? m.account_cash : m.account_bank;
}

function journalForTreasury(code: string, m: Mapping) {
  return code === m.account_cash ? "CAI" : "BAN";
}

const round = (n: number) => Math.round(num(n) * 100) / 100;

/* ------------------------------------------------------------------ ventes */

function salesEntry(doc: BillingDoc, m: Mapping): DerivedEntry | null {
  const ht = round(doc.total_ht);
  const vat = round(doc.total_vat);
  const ttc = round(doc.total_ttc);
  if (ttc <= 0) return null;
  const credit = isCreditNote(doc);
  const label = `${credit ? "Avoir" : "Facture"} ${doc.number} — ${doc.client_name}`;
  const lines: DerivedLine[] = credit
    ? [
        { account_code: m.account_sales, label: "Annulation vente HT", debit: ht, credit: 0 },
        ...(vat > 0
          ? [{ account_code: m.account_vat_collected, label: "TVA sur avoir", debit: vat, credit: 0 }]
          : []),
        { account_code: m.account_client, label: doc.client_name, debit: 0, credit: ttc },
      ]
    : [
        { account_code: m.account_client, label: doc.client_name, debit: ttc, credit: 0 },
        { account_code: m.account_sales, label: "Vente HT", debit: 0, credit: ht },
        ...(vat > 0
          ? [{ account_code: m.account_vat_collected, label: "TVA facturée", debit: 0, credit: vat }]
          : []),
      ];
  return {
    source_type: "billing_document",
    source_id: doc.id,
    entry_date: doc.issue_date,
    journal_code: "VEN",
    piece_number: doc.number,
    label,
    party_name: doc.client_name,
    pos_id: (doc as { pos_id?: string | null }).pos_id ?? null,
    lines,
  };
}

/* ------------------------------------------------------- règlements client */

function paymentEntry(
  p: Payment,
  doc: BillingDoc | undefined,
  m: Mapping,
): DerivedEntry | null {
  const amount = round(p.amount);
  if (amount <= 0) return null;
  const code = isCashMethod(p.method) ? m.account_cash : m.account_bank;
  const party = doc?.client_name ?? null;
  return {
    source_type: "billing_payment",
    source_id: p.id,
    entry_date: p.paid_at,
    journal_code: journalForTreasury(code, m),
    piece_number: p.reference ?? doc?.number ?? null,
    label: `Règlement client ${doc?.number ?? ""}`.trim(),
    party_name: party,
    pos_id: (doc as { pos_id?: string | null } | undefined)?.pos_id ?? null,
    lines: [
      { account_code: code, label: `Encaissement ${p.method}`, debit: amount, credit: 0 },
      { account_code: m.account_client, label: party ?? "Client", debit: 0, credit: amount },
    ],
  };
}

/* ------------------------------------------------------------------ achats */

function supplierInvoiceEntry(
  inv: SupplierInvoice,
  supplierName: string | null,
  m: Mapping,
): DerivedEntry | null {
  const ht = round(inv.total_ht);
  const vat = round(inv.total_vat);
  const ttc = round(inv.total_ttc);
  if (ttc <= 0) return null;
  const credit = inv.doc_type === "avoir_fournisseur";
  const chargeCode = looksPayroll(inv.description) ? m.account_payroll : m.account_purchases;
  const lines: DerivedLine[] = credit
    ? [
        { account_code: m.account_supplier, label: supplierName ?? "Fournisseur", debit: ttc, credit: 0 },
        { account_code: chargeCode, label: "Annulation achat HT", debit: 0, credit: ht },
        ...(vat > 0
          ? [{ account_code: m.account_vat_deductible, label: "TVA sur avoir", debit: 0, credit: vat }]
          : []),
      ]
    : [
        { account_code: chargeCode, label: inv.description || "Achat HT", debit: ht, credit: 0 },
        ...(vat > 0
          ? [{ account_code: m.account_vat_deductible, label: "TVA récupérable", debit: vat, credit: 0 }]
          : []),
        { account_code: m.account_supplier, label: supplierName ?? "Fournisseur", debit: 0, credit: ttc },
      ];
  return {
    source_type: "supplier_invoice",
    source_id: inv.id,
    entry_date: inv.issue_date,
    journal_code: "ACH",
    piece_number: inv.reference,
    label: `${credit ? "Avoir fournisseur" : "Facture fournisseur"} ${inv.reference}`,
    party_name: supplierName,
    pos_id: inv.pos_id,
    lines,
  };
}

/* --------------------------------------------------- dépenses et salaires */

function expenseEntry(
  ex: Expense,
  data: FinanceDataset,
  m: Mapping,
): DerivedEntry | null {
  const ht = round(ex.amount_ht);
  const vat = round(ex.vat_amount);
  const ttc = round(ex.amount_ttc);
  if (ttc <= 0) return null;
  const cat = data.expenseCategories.find((c) => c.id === ex.category_id);
  const payroll = looksPayroll(cat?.name) || looksPayroll(ex.description);
  const chargeCode =
    cat?.accounting_account || (payroll ? m.account_payroll : m.account_expense_default);
  const acc = data.accounts.find((a) => a.id === ex.account_id);
  // Dépense rattachée à une facture fournisseur : le paiement est déjà suivi via 4411.
  const counterpart = ex.supplier_invoice_id
    ? m.account_supplier
    : treasuryAccountCode(acc, m, ex.payment_method);
  const supplier = data.suppliers.find((s) => s.id === ex.supplier_id);
  return {
    source_type: "expense",
    source_id: ex.id,
    entry_date: ex.expense_date,
    journal_code: ex.supplier_invoice_id ? "ACH" : journalForTreasury(counterpart, m),
    piece_number: null,
    label: `${payroll ? "Salaire" : "Dépense"} — ${ex.description}`,
    party_name: supplier?.name ?? null,
    pos_id: ex.pos_id,
    lines: [
      { account_code: chargeCode, label: ex.description, debit: ht, credit: 0 },
      ...(vat > 0
        ? [{ account_code: m.account_vat_deductible, label: "TVA récupérable", debit: vat, credit: 0 }]
        : []),
      { account_code: counterpart, label: ex.payment_method, debit: 0, credit: ttc },
    ],
  };
}

/* ------------------------------------------------- banque, caisse, autres */

function transactionEntry(
  tx: FinancialTransaction,
  data: FinanceDataset,
  m: Mapping,
): DerivedEntry | null {
  const amount = round(tx.amount);
  if (amount <= 0) return null;
  const acc = data.accounts.find((a) => a.id === tx.account_id);
  const target = data.accounts.find((a) => a.id === tx.target_account_id);
  const code = treasuryAccountCode(acc, m, tx.payment_method);
  const targetCode = target ? treasuryAccountCode(target, m, tx.payment_method) : null;
  const supplier = data.suppliers.find((s) => s.id === tx.supplier_id);
  const party = tx.party_name ?? supplier?.name ?? null;
  const base = {
    source_type: "financial_transaction",
    source_id: tx.id,
    entry_date: tx.tx_date,
    piece_number: tx.reference,
    party_name: party,
    pos_id: tx.pos_id,
  };

  if (tx.tx_type === "virement" || tx.tx_type === "depot" || tx.tx_type === "retrait") {
    // Mouvement interne : un compte est débité, l'autre crédité.
    const other =
      targetCode ?? (code === m.account_cash ? m.account_bank : m.account_cash);
    const [debitCode, creditCode] =
      tx.tx_type === "retrait" ? [other, code] : [tx.tx_type === "depot" ? code : other, tx.tx_type === "depot" ? other : code];
    return {
      ...base,
      journal_code: "OD",
      label: tx.label,
      lines: [
        { account_code: debitCode, label: tx.label, debit: amount, credit: 0 },
        { account_code: creditCode, label: tx.label, debit: 0, credit: amount },
      ],
    };
  }

  if (tx.tx_type === "decaissement") {
    const counterpart = tx.supplier_invoice_id
      ? m.account_supplier
      : looksPayroll(tx.label) || tx.party_type === "salarie"
        ? m.account_payroll
        : supplier
          ? m.account_supplier
          : m.account_expense_default;
    return {
      ...base,
      journal_code: journalForTreasury(code, m),
      label: tx.label,
      lines: [
        { account_code: counterpart, label: tx.label, debit: amount, credit: 0 },
        { account_code: code, label: tx.payment_method, debit: 0, credit: amount },
      ],
    };
  }

  // encaissement / autre
  const counterpart = tx.billing_document_id ? m.account_client : m.account_sales;
  return {
    ...base,
    journal_code: journalForTreasury(code, m),
    label: tx.label,
    lines: [
      { account_code: code, label: tx.payment_method, debit: amount, credit: 0 },
      { account_code: counterpart, label: tx.label, debit: 0, credit: amount },
    ],
  };
}

/* ------------------------------------------------------------ orchestration */

/** Toutes les écritures attendues à partir des mouvements enregistrés. */
export function deriveEntries(data: FinanceDataset): DerivedEntry[] {
  const m = mappingOf(data);
  const out: DerivedEntry[] = [];
  const docById = new Map(data.documents.map((d) => [d.id, d]));

  for (const doc of data.documents) {
    if (doc.status === "brouillon") continue;
    if (!isSalesDoc(doc) && !isCreditNote(doc)) continue;
    const e = salesEntry(doc, m);
    if (e) out.push(e);
  }

  for (const p of data.payments) {
    const e = paymentEntry(p, docById.get(p.document_id), m);
    if (e) out.push(e);
  }

  for (const inv of data.supplierInvoices) {
    if (inv.status === "brouillon" || inv.status === "annule") continue;
    if (inv.doc_type === "bon_commande_fournisseur") continue;
    const supplier = data.suppliers.find((s) => s.id === inv.supplier_id);
    const e = supplierInvoiceEntry(
      inv,
      supplier?.name ?? (inv as { supplier_name?: string | null }).supplier_name ?? null,
      m,
    );
    if (e) out.push(e);
  }

  for (const ex of data.expenses) {
    const e = expenseEntry(ex, data, m);
    if (e) out.push(e);
  }

  for (const tx of data.transactions) {
    // La dépense génère déjà le mouvement de trésorerie associé.
    if (tx.expense_id) continue;
    // Évite le doublon avec un règlement client déjà saisi côté facturation.
    if (
      tx.billing_document_id &&
      data.payments.some(
        (p) =>
          p.document_id === tx.billing_document_id &&
          Math.abs(num(p.amount) - num(tx.amount)) < 0.005,
      )
    )
      continue;
    const e = transactionEntry(tx, data, m);
    if (e) out.push(e);
  }

  return out.sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

/** Écritures dérivées qui n'existent pas encore en base. */
export function pendingEntries(data: FinanceDataset): DerivedEntry[] {
  const existing = new Set(
    data.entries
      .filter((e) => e.source_type && e.source_id)
      .map((e) => `${e.source_type}:${e.source_id}`),
  );
  return deriveEntries(data).filter((e) => !existing.has(`${e.source_type}:${e.source_id}`));
}

export const SOURCE_LABELS: Record<string, string> = {
  billing_document: "Vente",
  billing_payment: "Encaissement client",
  supplier_invoice: "Achat fournisseur",
  expense: "Dépense / salaire",
  financial_transaction: "Banque / caisse",
};
