CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  item_type text NOT NULL DEFAULT 'product',
  item_id uuid,
  slug text,
  name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  quantity integer NOT NULL DEFAULT 1,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cart_items_email_idx ON public.cart_items (lower(email));
GRANT SELECT ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read carts" ON public.cart_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER cart_items_set_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  phone text,
  company text,
  note text,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  status text NOT NULL DEFAULT 'nouvelle',
  handled_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_email_idx ON public.orders (lower(email));
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read orders" ON public.orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'product',
  item_id uuid,
  slug text,
  name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read order items" ON public.order_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));