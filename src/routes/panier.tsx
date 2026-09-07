import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Mail, Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useCart } from "@/lib/cart";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/shop.functions";

export const Route = createFileRoute("/panier")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Mon panier — DODRICOM" },
      {
        name: "description",
        content:
          "Retrouvez votre panier DODRICOM avec votre email, modifiez vos articles et suivez l'avancement de vos commandes étape par étape.",
      },
      { property: "og:title", content: "Mon panier — DODRICOM" },
      { property: "og:description", content: "Votre panier et le suivi de vos commandes DODRICOM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function money(value: number, currency: string) {
  return `${value.toLocaleString("fr-FR")} ${currency}`;
}

function CartPage() {
  const { email, items, orders, total, loading, identify, signOutCart, setQuantity, remove, submit } = useCart();
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", company: "", note: "" });
  const [busy, setBusy] = useState(false);

  const currency = items[0]?.currency ?? "MAD";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Panier & suivi"
        title={
          <>
            Mon <span className="gradient-text">panier</span>.
          </>
        }
        subtitle="Saisissez votre email pour retrouver votre sélection et suivre l'avancement de vos commandes."
      />

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
        {!email ? (
          <div className="glass mx-auto max-w-lg p-8">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)]">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Accéder à mon panier</h2>
            <p className="mt-2 text-sm text-white/65">
              Vos articles et vos commandes restent disponibles à tout moment avec cette adresse email.
            </p>
            <form
              className="mt-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                const res = await identify(emailInput);
                if (!res.ok) setError(res.error);
              }}
            >
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--brand-violet)] focus:outline-none"
              />
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <button type="submit" className="btn-gradient mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold">
                Continuer
              </button>
            </form>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-white/60">
                  Connecté avec <span className="font-semibold text-white">{email}</span>
                </p>
                <button onClick={signOutCart} className="text-xs text-white/50 underline hover:text-white">
                  Changer d'email
                </button>
              </div>

              <div className="glass p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <ShoppingCart className="h-5 w-5 text-[color:var(--brand-violet)]" /> Articles ({items.length})
                </h2>
                {loading && <p className="mt-4 text-sm text-white/50">Chargement…</p>}
                {!loading && items.length === 0 && (
                  <div className="mt-5 text-sm text-white/60">
                    Votre panier est vide.{" "}
                    <Link to="/services" className="underline hover:text-white">
                      Découvrir nos services
                    </Link>
                  </div>
                )}
                <ul className="mt-5 space-y-4">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-16 w-16 place-items-center rounded-xl bg-white/5">
                          <Package className="h-6 w-6 text-white/50" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-white/55">{money(item.unitPrice, item.currency)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label="Diminuer"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/80 hover:text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          aria-label="Augmenter"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/80 hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        aria-label="Supprimer"
                        onClick={() => remove(item.id)}
                        className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-300 transition hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {orders.length > 0 && (
                <div className="glass mt-6 p-6">
                  <h2 className="text-lg font-bold text-white">Suivi de mes commandes</h2>
                  <ul className="mt-5 space-y-5">
                    {orders.map((order) => (
                      <li key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white">{order.number}</span>
                          <span className="text-sm gradient-text font-black">{money(order.total, order.currency)}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/50">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR")} · {order.items.length} article(s)
                        </p>
                        <Timeline status={order.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="glass sticky top-28 p-6">
                <h2 className="text-lg font-bold text-white">Confirmer la commande</h2>
                <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-sm text-white/70">Total</span>
                  <span className="text-2xl font-black gradient-text">{money(total, currency)}</span>
                </div>
                <form
                  className="mt-5 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError(null);
                    const res = await submit(form);
                    setBusy(false);
                    if (res.ok) {
                      setConfirmed(res.number);
                      setForm({ fullName: "", phone: "", company: "", note: "" });
                    } else setError(res.error);
                  }}
                >
                  <Input label="Nom complet" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
                  <Input label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <Input label="Société" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">Note</span>
                    <textarea
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--brand-violet)] focus:outline-none"
                      placeholder="Précisions sur votre demande…"
                    />
                  </label>
                  {error && <p className="text-sm text-red-300">{error}</p>}
                  {confirmed && (
                    <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                      <Check className="h-4 w-4" /> Commande {confirmed} envoyée !
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy || items.length === 0}
                    className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
                  >
                    {busy ? "Envoi…" : "Confirmer la commande"} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Timeline({ status }: { status: string }) {
  if (status === "annulee") {
    return (
      <p className="mt-3 inline-block rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-300">
        Commande annulée
      </p>
    );
  }
  const steps = ORDER_STATUSES.filter((s) => s !== "annulee");
  const current = Math.max(0, steps.indexOf(status as (typeof steps)[number]));
  return (
    <ol className="mt-4 flex items-center gap-1">
      {steps.map((s, i) => (
        <li key={s} className="flex-1">
          <div
            className={`h-1.5 rounded-full ${i <= current ? "bg-[var(--gradient-primary)]" : "bg-white/10"}`}
          />
          <span className={`mt-2 block text-[10px] ${i <= current ? "text-white" : "text-white/40"}`}>
            {ORDER_STATUS_LABELS[s]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[color:var(--brand-violet)] focus:outline-none"
      />
    </label>
  );
}
