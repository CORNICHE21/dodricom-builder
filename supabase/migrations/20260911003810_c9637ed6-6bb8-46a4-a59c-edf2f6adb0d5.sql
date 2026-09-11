
-- ============ TABLES ============
CREATE TABLE public.saas_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  version text NOT NULL DEFAULT '1.0.0',
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_apps TO authenticated;
GRANT ALL ON public.saas_apps TO service_role;
ALTER TABLE public.saas_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read saas_apps" ON public.saas_apps FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write saas_apps" ON public.saas_apps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_saas_apps_updated BEFORE UPDATE ON public.saas_apps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.saas_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.saas_apps(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.saas_services(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  route text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_services TO authenticated;
GRANT ALL ON public.saas_services TO service_role;
ALTER TABLE public.saas_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read saas_services" ON public.saas_services FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write saas_services" ON public.saas_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_saas_services_updated BEFORE UPDATE ON public.saas_services FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  period text NOT NULL DEFAULT 'monthly',
  max_users integer NOT NULL DEFAULT 1,
  storage_mb integer NOT NULL DEFAULT 1024,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_plans TO authenticated;
GRANT ALL ON public.saas_plans TO service_role;
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read saas_plans" ON public.saas_plans FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write saas_plans" ON public.saas_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_saas_plans_updated BEFORE UPDATE ON public.saas_plans FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.plan_apps (
  plan_id uuid NOT NULL REFERENCES public.saas_plans(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.saas_apps(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, app_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_apps TO authenticated;
GRANT ALL ON public.plan_apps TO service_role;
ALTER TABLE public.plan_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read plan_apps" ON public.plan_apps FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write plan_apps" ON public.plan_apps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.plan_services (
  plan_id uuid NOT NULL REFERENCES public.saas_plans(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.saas_services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_services TO authenticated;
GRANT ALL ON public.plan_services TO service_role;
ALTER TABLE public.plan_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read plan_services" ON public.plan_services FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write plan_services" ON public.plan_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  ice text,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'Maroc',
  logo_url text,
  storage_used_mb numeric NOT NULL DEFAULT 0,
  storage_limit_mb numeric NOT NULL DEFAULT 1024,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read companies" ON public.companies FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write companies" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.saas_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'Maroc',
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_clients TO authenticated;
GRANT ALL ON public.saas_clients TO service_role;
ALTER TABLE public.saas_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read saas_clients" ON public.saas_clients FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write saas_clients" ON public.saas_clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_saas_clients_updated BEFORE UPDATE ON public.saas_clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.client_apps (
  client_id uuid NOT NULL REFERENCES public.saas_clients(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.saas_apps(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, app_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_apps TO authenticated;
GRANT ALL ON public.client_apps TO service_role;
ALTER TABLE public.client_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read client_apps" ON public.client_apps FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write client_apps" ON public.client_apps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.saas_clients(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  app_id uuid REFERENCES public.saas_apps(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.saas_plans(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  period text NOT NULL DEFAULT 'monthly',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  status text NOT NULL DEFAULT 'active',
  renewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.saas_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_roles TO authenticated;
GRANT ALL ON public.saas_roles TO service_role;
ALTER TABLE public.saas_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read saas_roles" ON public.saas_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write saas_roles" ON public.saas_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_saas_roles_updated BEFORE UPDATE ON public.saas_roles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.saas_roles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.saas_services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write role_permissions" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role_id uuid REFERENCES public.saas_roles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_users TO authenticated;
GRANT ALL ON public.company_users TO service_role;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read company_users" ON public.company_users FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write company_users" ON public.company_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_company_users_updated BEFORE UPDATE ON public.company_users FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.user_service_permissions (
  company_user_id uuid NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.saas_services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_user_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_service_permissions TO authenticated;
GRANT ALL ON public.user_service_permissions TO service_role;
ALTER TABLE public.user_service_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read usp" ON public.user_service_permissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write usp" ON public.user_service_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.saas_clients(id) ON DELETE SET NULL,
  number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  amount_ht numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 20,
  amount_ttc numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  status text NOT NULL DEFAULT 'unpaid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_invoices TO authenticated;
GRANT ALL ON public.subscription_invoices TO service_role;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read sub_invoices" ON public.subscription_invoices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write sub_invoices" ON public.subscription_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_sub_invoices_updated BEFORE UPDATE ON public.subscription_invoices FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.subscription_invoices(id) ON DELETE CASCADE,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'virement',
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read sub_payments" ON public.subscription_payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin write sub_payments" ON public.subscription_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_sub_payments_updated BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ CATALOGUE ============
INSERT INTO public.saas_apps (code, name, description, sort_order) VALUES
  ('commercial','Gestion Commerciale','Clients, fournisseurs et documents commerciaux',1),
  ('crm','CRM','Prospection et relation client',2),
  ('stock','Gestion Stock','Articles, familles et suivi de stock',3),
  ('comptabilite','Comptabilité','Journal, grand livre, balance, bilan',4),
  ('rh','RH','Personnel, pointage, congés et paie',5),
  ('finance','Finance','Trésorerie, budget et analyse',6),
  ('paiement','Paiement','Règlements clients, fournisseurs et chèques',7);

INSERT INTO public.saas_services (app_id, parent_id, code, name, sort_order)
SELECT a.id, NULL, v.code, v.name, v.ord FROM public.saas_apps a
JOIN (VALUES
  ('commercial','commercial.clients','Clients',1),
  ('commercial','commercial.documents_clients','Documents Clients',2),
  ('commercial','commercial.fournisseurs','Fournisseurs',3),
  ('commercial','commercial.documents_fournisseurs','Documents Fournisseurs',4),
  ('crm','crm.prospects','Prospects',1),
  ('crm','crm.opportunites','Opportunités',2),
  ('crm','crm.activites','Activités',3),
  ('stock','stock.articles','Articles',1),
  ('stock','stock.famille','Famille',2),
  ('stock','stock.suivi','Suivi stock',3),
  ('comptabilite','compta.journal','Journal',1),
  ('comptabilite','compta.grand_livre','Grand livre',2),
  ('comptabilite','compta.balance','Balance',3),
  ('comptabilite','compta.bilan','Bilan',4),
  ('comptabilite','compta.resultat','Résultat',5),
  ('comptabilite','compta.banque','Banque',6),
  ('rh','rh.personnel','Personnel',1),
  ('rh','rh.pointage','Pointage',2),
  ('rh','rh.conges','Congés',3),
  ('rh','rh.paie','Paie',4),
  ('finance','finance.tresorerie','Trésorerie',1),
  ('finance','finance.budget','Budget',2),
  ('finance','finance.plan_financement','Plan financement',3),
  ('finance','finance.analyse','Analyse',4),
  ('finance','finance.rapprochement','Rapprochement',5),
  ('finance','finance.indicateurs','Indicateurs',6),
  ('paiement','paiement.clients','Paiements clients',1),
  ('paiement','paiement.fournisseurs','Paiements fournisseur',2),
  ('paiement','paiement.cheques','Chèques',3)
) AS v(app_code, code, name, ord) ON v.app_code = a.code;

INSERT INTO public.saas_plans (code, name, description, price, period, max_users, storage_mb, sort_order) VALUES
  ('free','Free','Découverte de la plateforme',0,'monthly',1,512,1),
  ('basic','Basic','Gestion commerciale essentielle',199,'monthly',3,2048,2),
  ('pro','Pro','Commercial et stock complets',499,'monthly',10,10240,3),
  ('premium','Premium','Ajoute comptabilité et finance',999,'monthly',25,51200,4),
  ('enterprise','Enterprise','Toutes les applications et services',1999,'monthly',100,204800,5);

-- Free / Basic : commercial de base
INSERT INTO public.plan_services (plan_id, service_id)
SELECT p.id, s.id FROM public.saas_plans p, public.saas_services s
WHERE p.code = 'basic' AND s.code IN ('commercial.clients','commercial.documents_clients');
INSERT INTO public.plan_services (plan_id, service_id)
SELECT p.id, s.id FROM public.saas_plans p, public.saas_services s
WHERE p.code = 'free' AND s.code IN ('commercial.clients');
INSERT INTO public.plan_services (plan_id, service_id)
SELECT p.id, s.id FROM public.saas_plans p, public.saas_services s
WHERE p.code = 'pro' AND s.code IN ('commercial.clients','commercial.documents_clients','commercial.fournisseurs','commercial.documents_fournisseurs','stock.articles','stock.famille','stock.suivi');
INSERT INTO public.plan_services (plan_id, service_id)
SELECT p.id, s.id FROM public.saas_plans p, public.saas_services s
WHERE p.code = 'premium' AND s.code NOT LIKE 'rh.%';
INSERT INTO public.plan_services (plan_id, service_id)
SELECT p.id, s.id FROM public.saas_plans p, public.saas_services s WHERE p.code = 'enterprise';

INSERT INTO public.plan_apps (plan_id, app_id)
SELECT DISTINCT ps.plan_id, s.app_id FROM public.plan_services ps
JOIN public.saas_services s ON s.id = ps.service_id;

INSERT INTO public.saas_roles (code, name, description, is_system, sort_order) VALUES
  ('administrator','Administrator','Accès complet',true,1),
  ('manager','Manager','Pilotage et supervision',true,2),
  ('commercial','Commercial','Ventes et clients',true,3),
  ('accountant','Accountant','Comptabilité et finance',true,4),
  ('rh','RH','Ressources humaines',true,5),
  ('user','User','Accès limité',true,6);

INSERT INTO public.role_permissions (role_id, service_id)
SELECT r.id, s.id FROM public.saas_roles r, public.saas_services s WHERE r.code = 'administrator';
INSERT INTO public.role_permissions (role_id, service_id)
SELECT r.id, s.id FROM public.saas_roles r, public.saas_services s
WHERE r.code = 'commercial' AND s.code LIKE 'commercial.%';
INSERT INTO public.role_permissions (role_id, service_id)
SELECT r.id, s.id FROM public.saas_roles r, public.saas_services s
WHERE r.code = 'accountant' AND (s.code LIKE 'compta.%' OR s.code LIKE 'finance.%' OR s.code LIKE 'paiement.%');
INSERT INTO public.role_permissions (role_id, service_id)
SELECT r.id, s.id FROM public.saas_roles r, public.saas_services s
WHERE r.code = 'rh' AND s.code LIKE 'rh.%';
