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