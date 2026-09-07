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