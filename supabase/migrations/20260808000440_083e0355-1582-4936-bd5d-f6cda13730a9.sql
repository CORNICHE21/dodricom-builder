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