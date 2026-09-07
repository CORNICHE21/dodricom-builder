import type { FinanceDataset } from "@/lib/finance-data";
import {
  accountBalance,
  buildSalesRows,
  inRange,
  isCreditNote,
  isSalesDoc,
  type Range,
  type SalesRow,
} from "@/lib/finance";

export type Scope = {
  data: FinanceDataset;
  range: Range;
  posId: string; // "all" ou un id
};

const posOk = (posId: string, v: string | null | undefined) => posId === "all" || v === posId;

export function scopeSelectors({ data, range, posId }: Scope) {
  const documents = data.documents.filter((d) => posOk(posId, (d as { pos_id?: string | null }).pos_id));
  const allRows = buildSalesRows(documents, data.payments);
  const rows = allRows.filter((r) => inRange(r.doc.issue_date, range));
  const salesRows = rows.filter((r) => isSalesDoc(r.doc));
  const creditRows = rows.filter((r) => isCreditNote(r.doc));

  const payments = data.payments.filter(
    (p) =>
      inRange(p.paid_at, range) &&
      documents.some((d) => d.id === p.document_id),
  );

  const expenses = data.expenses.filter(
    (e) => posOk(posId, e.pos_id) && inRange(e.expense_date, range),
  );
  const supplierInvoices = data.supplierInvoices.filter(
    (s) => posOk(posId, s.pos_id) && inRange(s.issue_date, range),
  );
  const transactions = data.transactions.filter(
    (t) => posOk(posId, t.pos_id) && inRange(t.tx_date, range),
  );

  const accounts = data.accounts.filter((a) => posOk(posId, a.pos_id));
  const balances = new Map(
    accounts.map((a) => [a.id, accountBalance(a, data.transactions)] as const),
  );
  const bankBalance = accounts
    .filter((a) => a.account_type !== "caisse")
    .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
  const cashBalance = accounts
    .filter((a) => a.account_type === "caisse")
    .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);

  const caHt = salesRows.reduce((s, r) => s + Number(r.doc.total_ht || 0), 0);
  const caTtc = salesRows.reduce((s, r) => s + Number(r.doc.total_ttc || 0), 0);
  const vatCollected = salesRows.reduce((s, r) => s + Number(r.doc.total_vat || 0), 0);
  const creditsTtc = creditRows.reduce((s, r) => s + Number(r.doc.total_ttc || 0), 0);
  const encaisse = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const receivables = allRows
    .filter((r) => isSalesDoc(r.doc))
    .reduce((s, r) => s + r.remaining, 0);

  const expenseHt = expenses.reduce((s, e) => s + Number(e.amount_ht || 0), 0);
  const expenseTtc = expenses.reduce((s, e) => s + Number(e.amount_ttc || 0), 0);
  const vatDeductible =
    expenses.reduce((s, e) => s + Number(e.vat_amount || 0), 0) +
    supplierInvoices.reduce((s, i) => s + Number(i.total_vat || 0), 0);

  const supplierDebt = data.supplierInvoices
    .filter((i) => posOk(posId, i.pos_id) && i.status !== "paye" && i.status !== "annule")
    .reduce((s, i) => s + Number(i.total_ttc || 0), 0);

  const purchasesHt = supplierInvoices.reduce((s, i) => s + Number(i.total_ht || 0), 0);
  const result = caHt - creditsTtc - expenseHt - purchasesHt;

  return {
    documents,
    allRows: allRows as SalesRow[],
    rows,
    salesRows,
    creditRows,
    payments,
    expenses,
    supplierInvoices,
    transactions,
    accounts,
    balances,
    bankBalance,
    cashBalance,
    caHt,
    caTtc,
    vatCollected,
    vatDeductible,
    creditsTtc,
    encaisse,
    receivables,
    expenseHt,
    expenseTtc,
    purchasesHt,
    supplierDebt,
    result,
  };
}

export type Selectors = ReturnType<typeof scopeSelectors>;
