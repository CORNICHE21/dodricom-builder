import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addToCart as addToCartFn,
  clearCart as clearCartFn,
  getCartAndOrders,
  removeFromCart as removeFromCartFn,
  setCartQuantity as setCartQuantityFn,
  submitOrder as submitOrderFn,
  type CartItemDTO,
  type OrderDTO,
} from "./shop.functions";

const STORAGE_KEY = "dodricom.cart.email";
const PENDING_KEY = "dodricom.cart.pending";

export type PendingItem = {
  itemType: string;
  itemId: string | null;
  slug: string | null;
  name: string;
  unitPrice: number;
  currency: string;
  imageUrl: string | null;
  quantity?: number;
};

interface CartContextValue {
  email: string | null;
  items: CartItemDTO[];
  orders: OrderDTO[];
  count: number;
  total: number;
  loading: boolean;
  identify: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOutCart: () => void;
  add: (item: PendingItem) => Promise<{ ok: boolean; pending?: boolean; error?: string }>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  submit: (info: { fullName?: string; phone?: string; company?: string; note?: string }) => Promise<
    { ok: true; number: string } | { ok: false; error: string }
  >;
}

const CartContext = createContext<CartContextValue | null>(null);

function readPending(): PendingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingItem[]) : [];
  } catch {
    return [];
  }
}

function writePending(items: PendingItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [items, setItems] = useState<CartItemDTO[]>([]);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPendingCount(readPending().length);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    setEmail(stored);
    setLoading(true);
    getCartAndOrders({ data: { email: stored } })
      .then((res) => {
        setItems(res.items);
        setOrders(res.orders);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const flushPending = useCallback(async (mail: string) => {
    const pending = readPending();
    let latest: CartItemDTO[] | null = null;
    for (const item of pending) {
      latest = await addToCartFn({ data: { ...item, email: mail } });
    }
    writePending([]);
    setPendingCount(0);
    return latest;
  }, []);

  const identify = useCallback<CartContextValue["identify"]>(
    async (value) => {
      const mail = value.trim().toLowerCase();
      setLoading(true);
      try {
        await flushPending(mail);
        const res = await getCartAndOrders({ data: { email: mail } });
        setItems(res.items);
        setOrders(res.orders);
        setEmail(mail);
        window.localStorage.setItem(STORAGE_KEY, mail);
        return { ok: true } as const;
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" } as const;
      } finally {
        setLoading(false);
      }
    },
    [flushPending],
  );

  const signOutCart = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setEmail(null);
    setItems([]);
    setOrders([]);
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    async (item) => {
      if (!email) {
        const pending = readPending();
        pending.push(item);
        writePending(pending);
        setPendingCount(pending.length);
        return { ok: true, pending: true };
      }
      try {
        const next = await addToCartFn({ data: { ...item, email } });
        setItems(next);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
      }
    },
    [email],
  );

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    async (id, quantity) => {
      if (!email) return;
      setItems(await setCartQuantityFn({ data: { email, id, quantity } }));
    },
    [email],
  );

  const remove = useCallback<CartContextValue["remove"]>(
    async (id) => {
      if (!email) return;
      setItems(await removeFromCartFn({ data: { email, id } }));
    },
    [email],
  );

  const clear = useCallback(async () => {
    if (!email) return;
    setItems(await clearCartFn({ data: { email } }));
  }, [email]);

  const submit = useCallback<CartContextValue["submit"]>(
    async (info) => {
      if (!email) return { ok: false, error: "Veuillez saisir votre email." };
      try {
        const res = await submitOrderFn({ data: { ...info, email } });
        setOrders(res.orders);
        setItems([]);
        return { ok: true, number: res.number };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
      }
    },
    [email],
  );

  const value = useMemo<CartContextValue>(() => {
    const count = email ? items.reduce((s, i) => s + i.quantity, 0) : pendingCount;
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { email, items, orders, count, total, loading, identify, signOutCart, add, setQuantity, remove, clear, submit };
  }, [email, items, orders, pendingCount, loading, identify, signOutCart, add, setQuantity, remove, clear, submit]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
