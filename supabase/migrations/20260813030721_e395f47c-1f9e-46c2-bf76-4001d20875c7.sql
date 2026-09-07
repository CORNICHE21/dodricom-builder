CREATE TABLE public.user_permissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  maintenance_access boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own permissions readable" ON public.user_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "admins manage permissions" ON public.user_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_user_permissions_updated BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'DODRICOM',
  address text,
  phone text,
  email text,
  website text,
  ice text,
  rc text,
  if_number text,
  patente text,
  rib text,
  capital text,
  logo_url text,
  letterhead_url text,
  stamp_url text,
  default_vat numeric NOT NULL DEFAULT 20,
  currency text NOT NULL DEFAULT 'MAD',
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_settings TO authenticated;
GRANT ALL ON public.billing_settings TO service_role;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read billing settings" ON public.billing_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage billing settings" ON public.billing_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_billing_settings_updated BEFORE UPDATE ON public.billing_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.billing_settings (company_name, address, phone, email, website, ice, rc, if_number, patente, rib, capital, terms)
VALUES ('DODRICOM S.A.R.L', 'Résidence le Printemps d''Anfa 96, Bvd ANFA, ETG 7, Bureau 71, Casablanca',
 '06 56 06 41 96 / 06 22 56 22 53 - Fixe : 05 22 91 43 45', 'Contact@dodricom.com', 'www.dodricom.com',
 '003703855000005', '676227', '66291984', '35408460', '011794000020210000685187', '100 000 Dirhams',
 E'- 50 % à la demande et 50 % à la livraison\n- Paiement par chèque ou virement bancaire');

CREATE TABLE public.billing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL DEFAULT 'facture',
  number text NOT NULL,
  status text NOT NULL DEFAULT 'brouillon',
  client_name text NOT NULL,
  client_address text,
  client_ice text,
  client_email text,
  client_phone text,
  order_ref text,
  city text DEFAULT 'Casablanca',
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  intro_text text,
  vat_rate numeric NOT NULL DEFAULT 20,
  discount numeric NOT NULL DEFAULT 0,
  deposit numeric NOT NULL DEFAULT 0,
  total_ht numeric NOT NULL DEFAULT 0,
  total_vat numeric NOT NULL DEFAULT 0,
  total_ttc numeric NOT NULL DEFAULT 0,
  net_to_pay numeric NOT NULL DEFAULT 0,
  terms text,
  notes text,
  source_document_id uuid REFERENCES public.billing_documents(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doc_type, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_documents TO authenticated;
GRANT ALL ON public.billing_documents TO service_role;
ALTER TABLE public.billing_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read documents" ON public.billing_documents FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage documents" ON public.billing_documents FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_billing_documents_updated BEFORE UPDATE ON public.billing_documents FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.billing_document_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.billing_documents(id) ON DELETE CASCADE,
  section text,
  designation text NOT NULL DEFAULT '',
  unit_price numeric NOT NULL DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'F',
  total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_document_lines TO authenticated;
GRANT ALL ON public.billing_document_lines TO service_role;
ALTER TABLE public.billing_document_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read lines" ON public.billing_document_lines FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage lines" ON public.billing_document_lines FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.billing_documents(id) ON DELETE CASCADE,
  paid_at date NOT NULL DEFAULT current_date,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'virement',
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_payments TO authenticated;
GRANT ALL ON public.billing_payments TO service_role;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read payments" ON public.billing_payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage payments" ON public.billing_payments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));