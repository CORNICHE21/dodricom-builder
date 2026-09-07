-- ============ Points de vente ============
CREATE TABLE public.pos_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  city text,
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_locations TO authenticated;
GRANT ALL ON public.pos_locations TO service_role;
ALTER TABLE public.pos_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read pos" ON public.pos_locations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write pos" ON public.pos_locations FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_pos_locations_updated BEFORE UPDATE ON public.pos_locations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Comptes financiers ============
CREATE TABLE public.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_type text NOT NULL DEFAULT 'banque',
  bank_name text,
  iban text,
  rib text,
  currency text NOT NULL DEFAULT 'MAD',
  opening_balance numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  pos_id uuid REFERENCES public.pos_locations(id) ON DELETE SET NULL,
  accounting_account text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO authenticated;
GRANT ALL ON public.financial_accounts TO service_role;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read fin accounts" ON public.financial_accounts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write fin accounts" ON public.financial_accounts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_financial_accounts_updated BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Fournisseurs ============
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ice text,
  if_number text,
  rc text,
  address text,
  city text,
  phone text,
  email text,
  rib text,
  payment_terms text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Factures fournisseurs / achats ============
CREATE TABLE public.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  doc_type text NOT NULL DEFAULT 'facture_fournisseur',
  reference text NOT NULL,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  description text,
  total_ht numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 20,
  total_vat numeric NOT NULL DEFAULT 0,
  total_ttc numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'brouillon',
  pos_id uuid REFERENCES public.pos_locations(id) ON DELETE SET NULL,
  attachment_url text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_invoices TO authenticated;
GRANT ALL ON public.supplier_invoices TO service_role;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read supplier invoices" ON public.supplier_invoices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write supplier invoices" ON public.supplier_invoices FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_supplier_invoices_updated BEFORE UPDATE ON public.supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Catégories de dépenses ============
CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  accounting_account text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT ALL ON public.expense_categories TO service_role;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read expense cats" ON public.expense_categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write expense cats" ON public.expense_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_expense_categories_updated BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.expense_categories (name, accounting_account, sort_order) VALUES
 ('Loyer','6131',1),('Salaires','6171',2),('Électricité','6125',3),('Eau','6125',4),
 ('Internet','6145',5),('Téléphone','6145',6),('Transport','6142',7),('Carburant','6122',8),
 ('Fournitures','6121',9),('Maintenance','6133',10),('Marketing','6144',11),
 ('Assurance','6134',12),('Taxes','6167',13),('Autres','6188',14);

-- ============ Dépenses ============
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT current_date,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_invoice_id uuid REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  amount_ht numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 20,
  vat_amount numeric NOT NULL DEFAULT 0,
  amount_ttc numeric NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  payment_method text NOT NULL DEFAULT 'espèces',
  pos_id uuid REFERENCES public.pos_locations(id) ON DELETE SET NULL,
  receipt_url text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write expenses" ON public.expenses FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Opérations de trésorerie ============
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_date date NOT NULL DEFAULT current_date,
  tx_type text NOT NULL DEFAULT 'encaissement',
  account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  target_account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  party_type text,
  party_name text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  billing_document_id uuid REFERENCES public.billing_documents(id) ON DELETE SET NULL,
  supplier_invoice_id uuid REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  pos_id uuid REFERENCES public.pos_locations(id) ON DELETE SET NULL,
  reference text,
  label text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'virement',
  attachment_url text,
  is_reconciled boolean NOT NULL DEFAULT false,
  reconciled_at timestamptz,
  comment text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read fin tx" ON public.financial_transactions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write fin tx" ON public.financial_transactions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_financial_transactions_updated BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_fin_tx_date ON public.financial_transactions (tx_date DESC);
CREATE INDEX idx_fin_tx_account ON public.financial_transactions (account_id);

-- ============ Taux de TVA ============
CREATE TABLE public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  rate numeric NOT NULL DEFAULT 20,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_rates TO authenticated;
GRANT ALL ON public.tax_rates TO service_role;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read tax rates" ON public.tax_rates FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write tax rates" ON public.tax_rates FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_tax_rates_updated BEFORE UPDATE ON public.tax_rates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.tax_rates (label, rate, is_default) VALUES
 ('Exonéré 0 %',0,false),('Réduit 7 %',7,false),('Réduit 10 %',10,false),('Réduit 14 %',14,false),('Normal 20 %',20,true);

-- ============ Comptabilité ============
CREATE TABLE public.accounting_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  account_type text NOT NULL DEFAULT 'charge',
  parent_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_accounts TO authenticated;
GRANT ALL ON public.accounting_accounts TO service_role;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read acc accounts" ON public.accounting_accounts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write acc accounts" ON public.accounting_accounts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_accounting_accounts_updated BEFORE UPDATE ON public.accounting_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.accounting_accounts (code, label, account_type) VALUES
 ('3421','Clients','actif'),('4411','Fournisseurs','passif'),('5141','Banque','actif'),
 ('5161','Caisse','actif'),('7111','Ventes de marchandises','produit'),('7121','Ventes de services','produit'),
 ('4455','État - TVA facturée','passif'),('3455','État - TVA récupérable','actif'),
 ('6121','Achats','charge'),('6131','Locations','charge'),('6171','Rémunérations du personnel','charge'),
 ('6188','Autres charges externes','charge');

CREATE TABLE public.accounting_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  journal_type text NOT NULL DEFAULT 'divers',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_journals TO authenticated;
GRANT ALL ON public.accounting_journals TO service_role;
ALTER TABLE public.accounting_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read journals" ON public.accounting_journals FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write journals" ON public.accounting_journals FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_accounting_journals_updated BEFORE UPDATE ON public.accounting_journals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.accounting_journals (code, label, journal_type) VALUES
 ('VEN','Journal des ventes','vente'),('ACH','Journal des achats','achat'),
 ('BAN','Journal de banque','banque'),('CAI','Journal de caisse','caisse'),
 ('OD','Opérations diverses','divers');

CREATE TABLE public.fiscal_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_periods TO authenticated;
GRANT ALL ON public.fiscal_periods TO service_role;
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read periods" ON public.fiscal_periods FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write periods" ON public.fiscal_periods FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_fiscal_periods_updated BEFORE UPDATE ON public.fiscal_periods FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.fiscal_periods (label, start_date, end_date) VALUES
 ('Exercice ' || EXTRACT(YEAR FROM current_date)::text, date_trunc('year', current_date)::date, (date_trunc('year', current_date) + interval '1 year - 1 day')::date);

CREATE TABLE public.accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  journal_code text NOT NULL DEFAULT 'OD',
  piece_number text,
  label text NOT NULL DEFAULT '',
  party_name text,
  source_type text,
  source_id uuid,
  pos_id uuid REFERENCES public.pos_locations(id) ON DELETE SET NULL,
  total_debit numeric NOT NULL DEFAULT 0,
  total_credit numeric NOT NULL DEFAULT 0,
  is_posted boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_entries TO authenticated;
GRANT ALL ON public.accounting_entries TO service_role;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read entries" ON public.accounting_entries FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write entries" ON public.accounting_entries FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_accounting_entries_updated BEFORE UPDATE ON public.accounting_entries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.accounting_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.accounting_entries(id) ON DELETE CASCADE,
  account_code text NOT NULL,
  label text NOT NULL DEFAULT '',
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_entry_lines TO authenticated;
GRANT ALL ON public.accounting_entry_lines TO service_role;
ALTER TABLE public.accounting_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read entry lines" ON public.accounting_entry_lines FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write entry lines" ON public.accounting_entry_lines FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_entry_lines_entry ON public.accounting_entry_lines (entry_id);

-- ============ Paramètres financiers ============
CREATE TABLE public.finance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL DEFAULT 'MAD',
  default_vat numeric NOT NULL DEFAULT 20,
  account_client text NOT NULL DEFAULT '3421',
  account_supplier text NOT NULL DEFAULT '4411',
  account_sales text NOT NULL DEFAULT '7121',
  account_vat_collected text NOT NULL DEFAULT '4455',
  account_vat_deductible text NOT NULL DEFAULT '3455',
  account_bank text NOT NULL DEFAULT '5141',
  account_cash text NOT NULL DEFAULT '5161',
  account_expense_default text NOT NULL DEFAULT '6188',
  low_cash_threshold numeric NOT NULL DEFAULT 1000,
  low_bank_threshold numeric NOT NULL DEFAULT 5000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_settings TO authenticated;
GRANT ALL ON public.finance_settings TO service_role;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read fin settings" ON public.finance_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write fin settings" ON public.finance_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_finance_settings_updated BEFORE UPDATE ON public.finance_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.finance_settings DEFAULT VALUES;

-- ============ Rattachement des documents de facturation à un point de vente ============
ALTER TABLE public.billing_documents ADD COLUMN IF NOT EXISTS pos_id uuid REFERENCES public.pos_locations(id) ON DELETE SET NULL;