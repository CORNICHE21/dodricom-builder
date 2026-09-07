/** Couche d'accès aux données du module Finance & Comptabilité (Lovable Cloud). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BillingDoc, Payment } from "@/lib/billing";
import type {
  AccountingAccount,
  AccountingEntry,
  AccountingEntryLine,
  Expense,
  ExpenseCategory,
  FinanceSettings,
  FinancialAccount,
  FinancialTransaction,
  FiscalPeriod,
  AccountingJournal,
  PosLocation,
  Supplier,
  SupplierInvoice,
  TaxRate,
} from "@/lib/finance";

export type FinanceDataset = {
  pos: PosLocation[];
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  suppliers: Supplier[];
  supplierInvoices: SupplierInvoice[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  taxRates: TaxRate[];
  chart: AccountingAccount[];
  journals: AccountingJournal[];
  entries: AccountingEntry[];
  entryLines: AccountingEntryLine[];
  periods: FiscalPeriod[];
  settings: FinanceSettings | null;
  documents: BillingDoc[];
  payments: Payment[];
};

async function list<T>(table: string, order: string, asc = true): Promise<T[]> {
  const { data, error } = await supabase
    .from(table as never)
    .select("*")
    .order(order, { ascending: asc });
  if (error) throw error;
  return (data ?? []) as T[];
}

export const FINANCE_QUERY_KEY = ["finance", "dataset"] as const;

export function useFinanceData() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEY,
    queryFn: async (): Promise<FinanceDataset> => {
      const [
        pos,
        accounts,
        transactions,
        suppliers,
        supplierInvoices,
        expenseCategories,
        expenses,
        taxRates,
        chart,
        journals,
        entries,
        entryLines,
        periods,
        settingsRes,
        documents,
        payments,
      ] = await Promise.all([
        list<PosLocation>("pos_locations", "sort_order"),
        list<FinancialAccount>("financial_accounts", "name"),
        list<FinancialTransaction>("financial_transactions", "tx_date", false),
        list<Supplier>("suppliers", "name"),
        list<SupplierInvoice>("supplier_invoices", "issue_date", false),
        list<ExpenseCategory>("expense_categories", "sort_order"),
        list<Expense>("expenses", "expense_date", false),
        list<TaxRate>("tax_rates", "rate"),
        list<AccountingAccount>("accounting_accounts", "code"),
        list<AccountingJournal>("accounting_journals", "code"),
        list<AccountingEntry>("accounting_entries", "entry_date", false),
        list<AccountingEntryLine>("accounting_entry_lines", "sort_order"),
        list<FiscalPeriod>("fiscal_periods", "start_date", false),
        supabase.from("finance_settings").select("*").limit(1).maybeSingle(),
        list<BillingDoc>("billing_documents", "issue_date", false),
        list<Payment>("billing_payments", "paid_at", false),
      ]);
      return {
        pos,
        accounts,
        transactions,
        suppliers,
        supplierInvoices,
        expenseCategories,
        expenses,
        taxRates,
        chart,
        journals,
        entries,
        entryLines,
        periods,
        settings: (settingsRes.data as FinanceSettings | null) ?? null,
        documents,
        payments,
      };
    },
  });
}

/** Upsert générique : insert si pas d'id, update sinon. */
export function useSaveRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, row }: { table: string; row: Record<string, unknown> }) => {
      const { id, ...rest } = row as { id?: string };
      const payload = rest as Record<string, unknown>;
      if (id) {
        const { error } = await supabase
          .from(table as never)
          .update(payload as never)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from(table as never)
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FINANCE_QUERY_KEY }),
  });
}

export function useDeleteRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FINANCE_QUERY_KEY }),
  });
}

/** Écriture comptable + lignes (débit = crédit vérifié en amont). */
export function useSaveEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entry,
      lines,
    }: {
      entry: Record<string, unknown>;
      lines: Record<string, unknown>[];
    }) => {
      const { id, ...rest } = entry as { id?: string };
      let entryId = id;
      if (entryId) {
        const { error } = await supabase
          .from("accounting_entries")
          .update(rest as never)
          .eq("id", entryId);
        if (error) throw error;
        await supabase.from("accounting_entry_lines").delete().eq("entry_id", entryId);
      } else {
        const { data, error } = await supabase
          .from("accounting_entries")
          .insert(rest as never)
          .select("id")
          .single();
        if (error) throw error;
        entryId = (data as { id: string }).id;
      }
      const payload = lines.map((l, i) => ({ ...l, entry_id: entryId, sort_order: i }));
      const { error: lerr } = await supabase
        .from("accounting_entry_lines")
        .insert(payload as never);
      if (lerr) throw lerr;
      return entryId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FINANCE_QUERY_KEY }),
  });
}

/** Export CSV téléchargé côté navigateur. */
export function exportCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
