DROP POLICY contact_messages_public_insert ON public.contact_messages;

CREATE POLICY contact_messages_public_insert ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND handled_by IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(message)) BETWEEN 5 AND 5000
  AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(email) <= 200
  AND (subject IS NULL OR length(subject) <= 200)
  AND (company IS NULL OR length(company) <= 200)
  AND (phone IS NULL OR length(phone) <= 40)
  AND (service_interest IS NULL OR length(service_interest) <= 100)
);

UPDATE public.service_categories SET name = 'IA' WHERE slug = 'ia';
UPDATE public.service_categories SET name = 'COM' WHERE slug = 'communication';

CREATE TABLE public.content_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL,
  text_key text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_slug, text_key)
);

GRANT SELECT ON public.content_texts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_texts TO authenticated;
GRANT ALL ON public.content_texts TO service_role;

ALTER TABLE public.content_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_texts public read" ON public.content_texts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content_texts staff insert" ON public.content_texts FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "content_texts staff update" ON public.content_texts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "content_texts staff delete" ON public.content_texts FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_content_texts_updated BEFORE UPDATE ON public.content_texts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.content_texts ADD COLUMN IF NOT EXISTS style jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.content_images (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  image_key text not null,
  url text,
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_slug, image_key)
);

GRANT SELECT ON public.content_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_images TO authenticated;
GRANT ALL ON public.content_images TO service_role;

ALTER TABLE public.content_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_images public read" ON public.content_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content_images staff insert" ON public.content_images FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "content_images staff update" ON public.content_images FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "content_images staff delete" ON public.content_images FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_content_images_updated BEFORE UPDATE ON public.content_images
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;

CREATE POLICY "cms read staff" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cms' AND public.is_staff(auth.uid()));
CREATE POLICY "cms insert staff" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cms' AND public.is_staff(auth.uid()));
CREATE POLICY "cms update staff" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cms' AND public.is_staff(auth.uid()));
CREATE POLICY "cms delete staff" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cms' AND public.is_staff(auth.uid()));