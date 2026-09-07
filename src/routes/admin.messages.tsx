import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Mail, Package, RefreshCw, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/shop.functions";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesPage,
});

type MessageRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

type OrderRow = {
  id: string;
  number: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  note: string | null;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  order_items: { id: string; name: string; unit_price: number; quantity: number; total: number }[];
};

const MESSAGE_STATUSES = ["new", "read", "replied", "archived"] as const;
const MESSAGE_LABELS: Record<string, string> = {
  new: "Nouveau",
  read: "Lu",
  replied: "Répondu",
  archived: "Archivé",
};

function MessagesPage() {
  const [tab, setTab] = useState<"orders" | "messages">("orders");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, o] = await Promise.all([
      supabase
        .from("contact_messages")
        .select("id, full_name, email, phone, company, subject, message, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "id, number, email, full_name, phone, company, note, total, currency, status, created_at, order_items(id, name, unit_price, quantity, total)",
        )
        .order("created_at", { ascending: false }),
    ]);
    setMessages((m.data ?? []) as MessageRow[]);
    setOrders((o.data ?? []) as unknown as OrderRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.number, o.email, o.full_name ?? "", o.phone ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [orders, query]);

  const filteredMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) =>
      [m.full_name, m.email, m.subject ?? "", m.message].join(" ").toLowerCase().includes(q),
    );
  }, [messages, query]);

  const updateOrderStatus = async (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  const updateMessageStatus = async (id: string, status: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    await supabase
      .from("contact_messages")
      .update({ status: status as MessageRow["status"] })
      .eq("id", id);
  };

  return (
    <AdminShell title="Messages" breadcrumbs={[{ label: "Messages" }]}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={Package}>
            Commandes ({orders.length})
          </TabButton>
          <TabButton active={tab === "messages"} onClick={() => setTab("messages")} icon={Mail}>
            Messages ({messages.length})
          </TabButton>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <button
            onClick={() => void load()}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {tab === "orders" ? (
        <div className="space-y-4">
          {filteredOrders.length === 0 && <Empty label="Aucune commande pour le moment." />}
          {filteredOrders.map((o) => (
            <article key={o.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {o.number} · {o.full_name ?? o.email}
                  </h3>
                  <p className="text-xs text-white/50">
                    {o.email}
                    {o.phone ? ` · ${o.phone}` : ""}
                    {o.company ? ` · ${o.company}` : ""} ·{" "}
                    {new Date(o.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span className="text-lg font-black gradient-text">
                  {Number(o.total).toLocaleString("fr-FR")} {o.currency}
                </span>
              </div>

              <ul className="mt-4 space-y-1 text-sm text-white/75">
                {(o.order_items ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between border-b border-white/5 py-1">
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <span>
                      {Number(i.total).toLocaleString("fr-FR")} {o.currency}
                    </span>
                  </li>
                ))}
              </ul>

              {o.note && <p className="mt-3 text-sm text-white/60">Note : {o.note}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => void updateOrderStatus(o.id, s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      o.status === s
                        ? "border-transparent bg-[var(--gradient-primary)] text-white"
                        : "border-white/15 text-white/60 hover:text-white"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.length === 0 && <Empty label="Aucun message pour le moment." />}
          {filteredMessages.map((m) => (
            <article key={m.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">{m.subject || "Sans objet"}</h3>
                  <p className="text-xs text-white/50">
                    {m.full_name} · {m.email}
                    {m.phone ? ` · ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-white/75">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {MESSAGE_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => void updateMessageStatus(m.id, s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      m.status === s
                        ? "border-transparent bg-[var(--gradient-primary)] text-white"
                        : "border-white/15 text-white/60 hover:text-white"
                    }`}
                  >
                    {MESSAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--gradient-primary)] text-white"
          : "border border-white/10 bg-white/5 text-white/65 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-white/50">
      <Inbox className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
