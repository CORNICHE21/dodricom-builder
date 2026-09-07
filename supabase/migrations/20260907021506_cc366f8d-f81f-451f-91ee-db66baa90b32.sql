CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL,
  referrer text,
  country text,
  city text,
  device text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX site_visits_created_idx ON public.site_visits (created_at DESC);
CREATE INDEX site_visits_session_idx ON public.site_visits (session_id);
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read visits" ON public.site_visits FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.supplier_invoice_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  designation text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 1,
  unit text,
  total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX supplier_invoice_lines_invoice_idx ON public.supplier_invoice_lines (invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_invoice_lines TO authenticated;
GRANT ALL ON public.supplier_invoice_lines TO service_role;
ALTER TABLE public.supplier_invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read supplier invoice lines" ON public.supplier_invoice_lines FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write supplier invoice lines" ON public.supplier_invoice_lines FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

ALTER TABLE public.supplier_invoices ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.supplier_invoices ADD COLUMN IF NOT EXISTS supplier_ice text;