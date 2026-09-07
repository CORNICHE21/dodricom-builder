
-- Public read on the 4 CMS buckets (private buckets, but Data API allows read via this policy)
CREATE POLICY "public_read_cms_buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('media', 'products', 'projects', 'hero'));

-- Staff (super_admin/admin/commercial) can write
CREATE POLICY "staff_insert_cms_buckets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('media', 'products', 'projects', 'hero')
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'commercial')
    )
  );

CREATE POLICY "staff_update_cms_buckets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('media', 'products', 'projects', 'hero')
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'commercial')
    )
  );

CREATE POLICY "staff_delete_cms_buckets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('media', 'products', 'projects', 'hero')
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'commercial')
    )
  );
