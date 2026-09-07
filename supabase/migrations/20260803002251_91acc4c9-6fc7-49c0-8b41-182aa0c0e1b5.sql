-- ============ ENUMS ============
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.message_status AS ENUM ('new', 'read', 'replied', 'archived');

-- ============ SITE SETTINGS ============
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_settings_public_read ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_settings_staff_write ON public.site_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PAGES ============
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  hero_image_url text,
  seo_title text,
  seo_description text,
  seo_image_url text,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY pages_public_read ON public.pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY pages_staff_read ON public.pages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY pages_staff_write ON public.pages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  heading text,
  subheading text,
  body text,
  image_url text,
  cta_label text,
  cta_url text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_key)
);
GRANT SELECT ON public.page_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT ALL ON public.page_sections TO service_role;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY page_sections_public_read ON public.page_sections FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY page_sections_staff_read ON public.page_sections FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY page_sections_staff_write ON public.page_sections FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ SERVICE CATEGORIES ============
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  icon text,
  image_url text,
  accent text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_categories_public_read ON public.service_categories FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY service_categories_staff_read ON public.service_categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY service_categories_staff_write ON public.service_categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric(12,2),
  currency text NOT NULL DEFAULT 'MAD',
  badge text,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_public_read ON public.products FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY products_staff_read ON public.products FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY products_staff_write ON public.products FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PACKAGES ============
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric(12,2),
  currency text NOT NULL DEFAULT 'MAD',
  billing_period text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_popular boolean NOT NULL DEFAULT false,
  cta_label text,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY packages_public_read ON public.packages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY packages_staff_read ON public.packages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY packages_staff_write ON public.packages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  client text,
  summary text,
  content text,
  cover_image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  year integer,
  location text,
  is_featured boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_public_read ON public.projects FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY projects_staff_read ON public.projects FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY projects_staff_write ON public.projects FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ BLOG ============
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text,
  cover_image_url text,
  category text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text,
  read_minutes integer,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY blog_posts_public_read ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY blog_posts_staff_read ON public.blog_posts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY blog_posts_staff_write ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ TESTIMONIALS ============
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text,
  company text,
  avatar_url text,
  quote text NOT NULL,
  rating smallint,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonials_public_read ON public.testimonials FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY testimonials_staff_read ON public.testimonials FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY testimonials_staff_write ON public.testimonials FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PARTNERS ============
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY partners_public_read ON public.partners FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY partners_staff_read ON public.partners FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY partners_staff_write ON public.partners FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ CONTACT MESSAGES ============
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  subject text,
  message text NOT NULL,
  service_interest text,
  status public.message_status NOT NULL DEFAULT 'new',
  handled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_messages_public_insert ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_messages_staff_read ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY contact_messages_staff_update ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY contact_messages_admin_delete ON public.contact_messages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ============ MEDIA LIBRARY ============
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'media',
  path text NOT NULL,
  public_url text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  alt_text text,
  folder text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_assets_staff_read ON public.media_assets FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY media_assets_staff_write ON public.media_assets FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ ACTIVITY LOG ============
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_log_staff_read ON public.activity_log FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY activity_log_staff_insert ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());

-- ============ UPDATED_AT TRIGGERS ============
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_page_sections_updated BEFORE UPDATE ON public.page_sections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_service_categories_updated BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_contact_messages_updated BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_media_assets_updated BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ INDEXES ============
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_packages_category ON public.packages(category_id);
CREATE INDEX idx_projects_category ON public.projects(category_id);
CREATE INDEX idx_page_sections_page ON public.page_sections(page_id);
CREATE INDEX idx_blog_published ON public.blog_posts(published_at DESC);
CREATE INDEX idx_contact_status ON public.contact_messages(status, created_at DESC);

-- ============ SEED : SITE SETTINGS ============
INSERT INTO public.site_settings (key, label, value) VALUES
('contact', 'Coordonnées', '{"phone":"+212 6 00 00 00 00","email":"contact@dodricom.com","address":"Casablanca, Maroc","hours":"Lun–Ven 9h–18h"}'),
('social', 'Réseaux sociaux', '{"linkedin":"https://linkedin.com","instagram":"https://instagram.com","facebook":"https://facebook.com","youtube":"https://youtube.com"}'),
('brand', 'Marque', '{"name":"DODRICOM","tagline":"L''innovation au service de votre performance","baseline":"Domotique · Digital · Réseaux · IA · Communication · Events"}'),
('stats', 'Chiffres clés', '{"items":[{"value":"150+","label":"Projets livrés"},{"value":"98%","label":"Clients satisfaits"},{"value":"6","label":"Pôles d''expertise"},{"value":"10+","label":"Années d''expérience"}]}'),
('footer', 'Pied de page', '{"about":"DODRICOM accompagne les entreprises ambitieuses avec des solutions premium en domotique, digital, réseaux, IA, communication et événementiel.","newsletter_title":"Restons connectés","copyright":"© DODRICOM. Tous droits réservés."}');

-- ============ SEED : PAGES ============
INSERT INTO public.pages (slug, title, subtitle, seo_title, seo_description, sort_order) VALUES
('accueil', 'Accueil', 'L''innovation au service de votre performance', 'DODRICOM — L''innovation au service de votre performance', 'Solutions premium en Domotique, Digital, Réseaux, IA, Communication et Événementiel.', 1),
('a-propos', 'À propos', 'Notre mission, notre vision', 'À propos — DODRICOM', 'Découvrez la mission, la vision et les valeurs de DODRICOM.', 2),
('services', 'Services', 'Six pôles d''expertise', 'Services — DODRICOM', 'Domotique, Digital, Réseaux, IA, Communication et Events.', 3),
('realisations', 'Réalisations', 'Nos projets récents', 'Réalisations — DODRICOM', 'Portfolio des projets réalisés par DODRICOM.', 4),
('saas', 'SaaS', 'Nos plateformes en ligne', 'SaaS — DODRICOM', 'Les solutions SaaS développées par DODRICOM.', 5),
('blog', 'Blog', 'Actualités & insights', 'Blog — DODRICOM', 'Articles et actualités DODRICOM.', 6),
('contact', 'Contact', 'Parlons de votre projet', 'Contact — DODRICOM', 'Contactez les équipes DODRICOM.', 7);

INSERT INTO public.page_sections (page_id, section_key, heading, subheading, body, cta_label, cta_url, sort_order)
SELECT id, 'hero', 'VOTRE PERFORMANCE', 'L''innovation au service de', 'Domotique, digital, réseaux, intelligence artificielle, communication et événementiel — réunis sous un même toit.', 'Demander un devis', '/contact', 1
FROM public.pages WHERE slug = 'accueil';

INSERT INTO public.page_sections (page_id, section_key, heading, body, sort_order)
SELECT id, 'mission', 'Notre mission', 'Accompagner les entreprises marocaines dans leur transformation technologique avec des solutions premium, durables et sur mesure.', 1
FROM public.pages WHERE slug = 'a-propos';

INSERT INTO public.page_sections (page_id, section_key, heading, body, sort_order)
SELECT id, 'vision', 'Notre vision', 'Devenir le partenaire technologique de référence en Afrique du Nord, en alliant excellence technique et design d''exception.', 2
FROM public.pages WHERE slug = 'a-propos';

-- ============ SEED : SERVICE CATEGORIES ============
INSERT INTO public.service_categories (slug, name, tagline, description, icon, accent, features, sort_order) VALUES
('domotique', 'Domotique', 'Maisons et bureaux intelligents', 'Automatisation, éclairage connecté, sécurité, confort thermique et pilotage centralisé.', 'Home', 'violet', '["Éclairage intelligent","Sécurité & vidéosurveillance","Contrôle d''accès","Gestion énergétique","Pilotage vocal"]', 1),
('digital', 'Digital', 'Sites, apps et croissance en ligne', 'Sites web premium, applications sur mesure, e-commerce, SEO et acquisition.', 'Globe', 'blue', '["Sites vitrines & e-commerce","Applications web & mobile","SEO & content","Publicité en ligne","Analytics"]', 2),
('reseaux', 'Réseaux', 'Infrastructure fiable et sécurisée', 'Câblage structuré, Wi-Fi haute densité, datacenter, supervision et cybersécurité.', 'Network', 'cyan', '["Câblage structuré","Wi-Fi professionnel","Baies & datacenter","Firewall & VPN","Supervision 24/7"]', 3),
('ia', 'Intelligence Artificielle', 'Automatisez, prédisez, décidez', 'Agents conversationnels, vision par ordinateur, automatisation des processus et data.', 'Brain', 'violet', '["Chatbots & agents IA","Vision par ordinateur","Automatisation métier","Data & prédiction","Intégration LLM"]', 4),
('communication', 'Communication', 'Branding et contenus qui marquent', 'Identité visuelle, production audiovisuelle, motion design et stratégie de marque.', 'Megaphone', 'pink', '["Identité de marque","Production vidéo","Motion design","Photographie","Social media"]', 5),
('events', 'Events', 'Des expériences mémorables', 'Conception, scénographie, technique son/lumière et gestion complète d''événements.', 'Sparkles', 'blue', '["Scénographie","Son & lumière","Écrans LED","Régie technique","Coordination complète"]', 6);

-- ============ SEED : PRODUCTS ============
INSERT INTO public.products (category_id, slug, name, tagline, description, price, badge, is_featured, sort_order)
SELECT c.id, v.slug, v.name, v.tagline, v.description, v.price, v.badge, v.featured, v.sort_order
FROM (VALUES
  ('domotique','ampoule-connectee','Ampoule connectée RGB','16M de couleurs, pilotage app & voix','Éclairage intelligent avec scénarios, programmation horaire et intégration assistant vocal.',249.00,'Best-seller',true,1),
  ('domotique','serrure-intelligente','Serrure intelligente','Empreinte, code, badge et smartphone','Contrôle d''accès sécurisé avec historique des ouvertures et codes temporaires.',2490.00,'Nouveau',true,2),
  ('domotique','thermostat-smart','Thermostat connecté','Jusqu''à 30% d''économies','Régulation thermique intelligente avec apprentissage des habitudes.',1290.00,NULL,false,3),
  ('domotique','camera-4k','Caméra de surveillance 4K','Vision nocturne & détection IA','Caméra IP 4K avec détection de personnes par IA et stockage cloud.',1890.00,NULL,false,4),
  ('reseaux','borne-wifi6','Borne Wi-Fi 6 Pro','Haute densité, jusqu''à 200 clients','Point d''accès Wi-Fi 6 professionnel pour bureaux et espaces publics.',3200.00,'Pro',true,1),
  ('reseaux','switch-poe-24','Switch PoE+ 24 ports','Alimentation et données sur un câble','Switch manageable Gigabit PoE+ pour infrastructures professionnelles.',5400.00,NULL,false,2),
  ('reseaux','baie-42u','Baie serveur 42U','Ventilée, sécurisée, organisée','Baie rack complète avec gestion thermique et câblage structuré.',8900.00,NULL,false,3),
  ('digital','pack-site-vitrine','Site vitrine premium','Design sur mesure, responsive, SEO','Site web haut de gamme livré clé en main avec optimisation SEO.',15000.00,'Populaire',true,1),
  ('ia','agent-ia-support','Agent IA support client','Disponible 24/7, multilingue','Assistant conversationnel entraîné sur vos données, intégré à votre site.',12000.00,'IA',true,1),
  ('communication','pack-branding','Pack identité de marque','Logo, charte, déclinaisons','Création complète d''identité visuelle avec guide de marque.',9500.00,NULL,true,1),
  ('events','ecran-led-outdoor','Écran LED extérieur','Haute luminosité, modulaire','Location et installation d''écrans LED pour événements en extérieur.',NULL,'Location',false,1)
) AS v(cat, slug, name, tagline, description, price, badge, featured, sort_order)
JOIN public.service_categories c ON c.slug = v.cat;

-- ============ SEED : PACKAGES ============
INSERT INTO public.packages (category_id, slug, name, description, price, billing_period, features, is_popular, cta_label, sort_order)
SELECT c.id, v.slug, v.name, v.description, v.price, v.period, v.features::jsonb, v.popular, 'Demander un devis', v.sort_order
FROM (VALUES
  ('domotique','pack-essentiel','Pack Essentiel','L''entrée idéale dans la maison connectée.',9900.00,'projet','["Éclairage 5 pièces","1 serrure connectée","Application mobile","Installation incluse","Garantie 2 ans"]',false,1),
  ('domotique','pack-premium','Pack Premium','Confort, sécurité et énergie pilotés.',24900.00,'projet','["Éclairage complet","Serrures & contrôle d''accès","4 caméras 4K","Thermostat intelligent","Domotique centralisée","Support prioritaire"]',true,2),
  ('domotique','pack-signature','Pack Signature','L''expérience domotique totale, sur mesure.',59000.00,'projet','["Étude & conception 3D","Automatisation complète","Home cinéma & audio","Sécurité périmétrique","Supervision à distance","Maintenance 3 ans"]',false,3),
  ('digital','pack-digital-start','Digital Start','Votre présence en ligne, proprement lancée.',15000.00,'projet','["Site vitrine 5 pages","Design sur mesure","SEO de base","Hébergement 1 an","Formation"]',false,1),
  ('digital','pack-digital-growth','Digital Growth','Acquisition et conversion à l''échelle.',38000.00,'projet','["Site ou e-commerce","SEO avancé","Campagnes publicitaires","Analytics & tableaux de bord","Support 6 mois"]',true,2)
) AS v(cat, slug, name, description, price, period, features, popular, sort_order)
JOIN public.service_categories c ON c.slug = v.cat;

-- ============ SEED : PROJECTS ============
INSERT INTO public.projects (category_id, slug, title, client, summary, year, location, is_featured, tags, sort_order)
SELECT c.id, v.slug, v.title, v.client, v.summary, v.year, v.location, v.featured, v.tags::jsonb, v.sort_order
FROM (VALUES
  ('domotique','villa-anfa','Villa connectée Anfa','Client privé','Automatisation complète d''une villa de 800m² : éclairage, sécurité, climatisation et home cinéma.',2025,'Casablanca',true,'["Domotique","Luxe","Sécurité"]',1),
  ('reseaux','datacenter-corporate','Datacenter corporate','Groupe industriel','Conception et déploiement d''une salle serveur redondante avec supervision 24/7.',2025,'Casablanca',true,'["Réseaux","Datacenter"]',2),
  ('digital','plateforme-ecommerce','Plateforme e-commerce','Retail national','Refonte complète d''une boutique en ligne avec +180% de conversions.',2024,'Rabat',true,'["Digital","E-commerce"]',3),
  ('ia','assistant-ia-bancaire','Assistant IA bancaire','Institution financière','Agent conversationnel multilingue traitant 70% des demandes de premier niveau.',2025,'Casablanca',false,'["IA","Support"]',4),
  ('communication','campagne-brand','Campagne de marque','Groupe agroalimentaire','Identité visuelle, film publicitaire et déploiement multicanal.',2024,'Marrakech',false,'["Communication","Branding"]',5),
  ('events','gala-annuel','Gala annuel 1200 invités','Grand groupe','Scénographie, régie technique, écrans LED et coordination complète.',2025,'Marrakech',true,'["Events","Scénographie"]',6)
) AS v(cat, slug, title, client, summary, year, location, featured, tags, sort_order)
JOIN public.service_categories c ON c.slug = v.cat;

-- ============ SEED : BLOG ============
INSERT INTO public.blog_posts (slug, title, excerpt, content, category, author_name, read_minutes, published_at, tags) VALUES
('domotique-2026-tendances','Domotique 2026 : les tendances qui changent la donne','Matter, IA locale et efficacité énergétique redéfinissent la maison connectée.','Le standard Matter arrive à maturité et permet enfin une interopérabilité réelle entre marques. Parallèlement, l''IA embarquée localement réduit la dépendance au cloud et améliore la vie privée. Enfin, la gestion énergétique devient le premier argument d''achat.','Domotique','Équipe DODRICOM',5,now() - interval '5 days','["Domotique","Matter","IA"]'),
('wifi6-entreprise','Wi-Fi 6 en entreprise : ce qu''il faut vraiment savoir','Densité, latence et sécurité : les gains concrets d''une migration Wi-Fi 6.','Le Wi-Fi 6 n''est pas seulement plus rapide : il gère bien mieux la densité d''appareils grâce à OFDMA et MU-MIMO. Pour des bureaux de plus de 50 postes, le gain de latence est immédiatement perceptible.','Réseaux','Équipe DODRICOM',6,now() - interval '12 days','["Réseaux","Wi-Fi"]'),
('ia-service-client','L''IA au service de la relation client','Comment un agent conversationnel bien conçu améliore la satisfaction.','Un agent IA n''a pas vocation à remplacer vos équipes, mais à absorber le volume répétitif. Bien entraîné sur vos données internes, il traite 60 à 80% des demandes de niveau 1.','IA','Équipe DODRICOM',4,now() - interval '20 days','["IA","Support"]');

-- ============ SEED : TESTIMONIALS ============
INSERT INTO public.testimonials (author_name, author_role, company, quote, rating, sort_order) VALUES
('Yassine B.','Directeur Général','Groupe Atlas','DODRICOM a transformé notre infrastructure réseau. Zéro interruption depuis la mise en service.',5,1),
('Salma K.','Responsable Marketing','Retail Maroc','Le site livré dépasse nos attentes, autant sur le design que sur les performances.',5,2),
('Karim E.','Propriétaire','Villa privée','Une installation domotique irréprochable, du conseil à la formation finale.',5,3);

-- ============ SEED : PARTNERS ============
INSERT INTO public.partners (name, website_url, sort_order) VALUES
('Ubiquiti','https://ui.com',1),
('Legrand','https://legrand.com',2),
('Cisco','https://cisco.com',3),
('Somfy','https://somfy.com',4),
('Hikvision','https://hikvision.com',5);