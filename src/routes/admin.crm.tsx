import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Package, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/crm")({ component: CrmProductsPage });

type Category = { id: string; slug: string; name: string };
type Product = {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  badge: string | null;
  stock_quantity: number;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function emptyProduct(categoryId: string | null): Product {
  return {
    id: "",
    category_id: categoryId,
    slug: "",
    name: "",
    tagline: "",
    description: "",
    image_url: null,
    price: null,
    currency: "MAD",
    badge: "",
    stock_quantity: 0,
    status: "published",
    sort_order: 0,
  };
}

function CrmProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [cats, prods] = await Promise.all([
      supabase.from("service_categories").select("id, slug, name").order("sort_order"),
      supabase
        .from("products")
        .select(
          "id, category_id, slug, name, tagline, description, image_url, price, currency, badge, stock_quantity, status, sort_order",
        )
        .order("sort_order"),
    ]);
    if (cats.error) setError(cats.error.message);
    if (prods.error) setError(prods.error.message);
    setCategories(cats.data ?? []);
    setProducts((prods.data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (activeCat === "all" || p.category_id === activeCat) &&
        (!q || p.name.toLowerCase().includes(q) || (p.tagline ?? "").toLowerCase().includes(q)),
    );
  }, [products, activeCat, search]);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const uploadImage = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    setError(null);
    const path = `products/${slugify(editing.name || "produit")}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const up = await supabase.storage.from("cms").upload(path, file, { upsert: true });
    if (up.error) {
      setUploading(false);
      return setError(up.error.message);
    }
    const signed = await supabase.storage.from("cms").createSignedUrl(path, 60 * 60 * 24 * 3650);
    setUploading(false);
    if (!signed.data?.signedUrl) return setError(signed.error?.message ?? "URL introuvable");
    setEditing({ ...editing, image_url: signed.data.signedUrl });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const payload = {
      category_id: editing.category_id,
      slug: editing.slug || slugify(editing.name),
      name: editing.name,
      tagline: editing.tagline,
      description: editing.description,
      image_url: editing.image_url,
      price: editing.price,
      currency: editing.currency || "MAD",
      badge: editing.badge,
      stock_quantity: editing.stock_quantity ?? 0,
      status: editing.status,
      sort_order: editing.sort_order ?? 0,
    };
    const res = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (res.error) return setError(res.error.message);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) return setError(err.message);
    await load();
  };

  return (
    <AdminShell title="Commercial (CRM)" breadcrumbs={[{ label: "Commercial (CRM)" }, { label: "Produits" }]}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {[{ id: "all", name: "Tous" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeCat === c.id ? "bg-white/[0.1] text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-44 bg-transparent text-sm text-white placeholder-white/40 outline-none"
            />
          </div>
          <button
            onClick={() => setEditing(emptyProduct(activeCat === "all" ? (categories[0]?.id ?? null) : activeCat))}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Nouveau produit
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-white/50">Chargement des produits…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <article key={p.id} className="glass overflow-hidden">
              <div className="aspect-[4/3] bg-black/40">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/25">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{catName(p.category_id)}</p>
                <h3 className="mt-1 text-sm font-bold text-white">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-white/50">{p.tagline}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    {p.price === null ? "—" : `${Number(p.price).toLocaleString("fr-FR")} ${p.currency}`}
                  </span>
                  <span className={p.stock_quantity > 0 ? "text-emerald-300" : "text-rose-300"}>
                    Stock : {p.stock_quantity}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setEditing(p)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/80 hover:text-white"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => void remove(p.id)}
                    className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-rose-200 hover:bg-rose-400/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!visible.length && <p className="text-sm text-white/50">Aucun produit dans ce pôle.</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass my-8 w-full max-w-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editing.id ? "Modifier le produit" : "Nouveau produit"}</h3>
              <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelCls}>Nom du produit</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Service (pôle)</span>
                <select
                  value={editing.category_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelCls}>Badge (optionnel)</span>
                <input
                  value={editing.badge ?? ""}
                  onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Prix</span>
                <input
                  type="number"
                  value={editing.price ?? ""}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value === "" ? null : Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Devise</span>
                <input
                  value={editing.currency}
                  onChange={(e) => setEditing({ ...editing, currency: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Quantité en stock</span>
                <input
                  type="number"
                  value={editing.stock_quantity}
                  onChange={(e) => setEditing({ ...editing, stock_quantity: Number(e.target.value || 0) })}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Statut</span>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as Product["status"] })}
                  className={inputCls}
                >
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivé</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={labelCls}>Accroche</span>
                <input
                  value={editing.tagline ?? ""}
                  onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelCls}>Informations / description</span>
                <textarea
                  rows={4}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </label>

              <div className="sm:col-span-2">
                <span className={labelCls}>Image du produit</span>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-32 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {editing.image_url ? (
                      <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-white/35">Aucune</div>
                    )}
                  </div>
                  <label className="btn-gradient inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Téléverser
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={() => void save()}
                disabled={saving || !editing.name}
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
