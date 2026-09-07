import { createServerFn } from "@tanstack/react-start";

export type CartItemDTO = {
  id: string;
  itemType: string;
  itemId: string | null;
  slug: string | null;
  name: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  imageUrl: string | null;
};

export type OrderItemDTO = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

export type OrderDTO = {
  id: string;
  number: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  company: string | null;
  note: string | null;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItemDTO[];
};

export const ORDER_STATUSES = [
  "nouvelle",
  "confirmee",
  "en_preparation",
  "en_livraison",
  "livree",
  "annulee",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

function normalizeEmail(email: string) {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Adresse email invalide.");
  return value;
}

type CartRow = {
  id: string;
  item_type: string;
  item_id: string | null;
  slug: string | null;
  name: string;
  unit_price: number | string;
  currency: string;
  quantity: number;
  image_url: string | null;
};

function toCartItem(row: CartRow): CartItemDTO {
  return {
    id: row.id,
    itemType: row.item_type,
    itemId: row.item_id,
    slug: row.slug,
    name: row.name,
    unitPrice: Number(row.unit_price),
    currency: row.currency,
    quantity: row.quantity,
    imageUrl: row.image_url,
  };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadCart(email: string): Promise<CartItemDTO[]> {
  const db = await admin();
  const { data, error } = await db
    .from("cart_items")
    .select("id, item_type, item_id, slug, name, unit_price, currency, quantity, image_url")
    .eq("email", email)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => toCartItem(r as CartRow));
}

async function loadOrders(email: string): Promise<OrderDTO[]> {
  const db = await admin();
  const { data, error } = await db
    .from("orders")
    .select(
      "id, number, email, full_name, phone, company, note, total, currency, status, created_at, order_items(id, name, unit_price, quantity, total)",
    )
    .eq("email", email)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((o) => ({
    id: o.id,
    number: o.number,
    email: o.email,
    fullName: o.full_name,
    phone: o.phone,
    company: o.company,
    note: o.note,
    total: Number(o.total),
    currency: o.currency,
    status: o.status,
    createdAt: o.created_at,
    items: ((o as unknown as { order_items: Array<Record<string, unknown>> }).order_items ?? []).map((i) => ({
      id: String(i["id"]),
      name: String(i["name"]),
      unitPrice: Number(i["unit_price"]),
      quantity: Number(i["quantity"]),
      total: Number(i["total"]),
    })),
  }));
}

export const getCartAndOrders = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const [items, orders] = await Promise.all([loadCart(email), loadOrders(email)]);
    return { items, orders };
  });

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      email: string;
      itemType: string;
      itemId: string | null;
      slug: string | null;
      name: string;
      unitPrice: number;
      currency: string;
      imageUrl: string | null;
      quantity?: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const db = await admin();
    const qty = Math.max(1, Math.min(99, Math.round(data.quantity ?? 1)));

    const { data: existing } = await db
      .from("cart_items")
      .select("id, quantity")
      .eq("email", email)
      .eq("item_type", data.itemType)
      .eq("name", data.name)
      .maybeSingle();

    if (existing) {
      const { error } = await db
        .from("cart_items")
        .update({ quantity: Math.min(99, existing.quantity + qty) })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("cart_items").insert({
        email,
        item_type: data.itemType,
        item_id: data.itemId,
        slug: data.slug,
        name: data.name,
        unit_price: data.unitPrice,
        currency: data.currency || "MAD",
        quantity: qty,
        image_url: data.imageUrl,
      });
      if (error) throw new Error(error.message);
    }
    return loadCart(email);
  });

export const setCartQuantity = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; id: string; quantity: number }) => data)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const db = await admin();
    const qty = Math.round(data.quantity);
    if (qty <= 0) {
      await db.from("cart_items").delete().eq("id", data.id).eq("email", email);
    } else {
      await db
        .from("cart_items")
        .update({ quantity: Math.min(99, qty) })
        .eq("id", data.id)
        .eq("email", email);
    }
    return loadCart(email);
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; id: string }) => data)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const db = await admin();
    const { error } = await db.from("cart_items").delete().eq("id", data.id).eq("email", email);
    if (error) throw new Error(error.message);
    return loadCart(email);
  });

export const clearCart = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const db = await admin();
    await db.from("cart_items").delete().eq("email", email);
    return [] as CartItemDTO[];
  });

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { email: string; fullName?: string; phone?: string; company?: string; note?: string }) => data,
  )
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const db = await admin();
    const items = await loadCart(email);
    if (items.length === 0) throw new Error("Votre panier est vide.");

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const currency = items[0]?.currency ?? "MAD";
    const year = new Date().getFullYear();
    const { count } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01`);
    const number = `CMD${String(year).slice(2)}${String((count ?? 0) + 1).padStart(5, "0")}`;

    const { data: order, error } = await db
      .from("orders")
      .insert({
        number,
        email,
        full_name: data.fullName?.trim() || null,
        phone: data.phone?.trim() || null,
        company: data.company?.trim() || null,
        note: data.note?.trim() || null,
        total,
        currency,
        status: "nouvelle",
      })
      .select("id, number")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await db.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        item_type: i.itemType,
        item_id: i.itemId,
        slug: i.slug,
        name: i.name,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        total: i.unitPrice * i.quantity,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    // Notify the back-office messaging inbox
    await db.from("contact_messages").insert({
      full_name: data.fullName?.trim() || email,
      email,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      subject: `Nouvelle commande ${order.number}`,
      service_interest: "commande",
      message: [
        `Commande ${order.number} — total ${total.toLocaleString("fr-FR")} ${currency}`,
        ...items.map((i) => `• ${i.name} × ${i.quantity} — ${(i.unitPrice * i.quantity).toLocaleString("fr-FR")} ${currency}`),
        data.note?.trim() ? `Note : ${data.note.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    await db.from("cart_items").delete().eq("email", email);

    const orders = await loadOrders(email);
    return { number: order.number, orders };
  });
