CREATE POLICY "cms read staff" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cms' AND public.is_staff(auth.uid()));
CREATE POLICY "cms insert staff" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cms' AND public.is_staff(auth.uid()));
CREATE POLICY "cms update staff" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cms' AND public.is_staff(auth.uid()));
CREATE POLICY "cms delete staff" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cms' AND public.is_staff(auth.uid()));