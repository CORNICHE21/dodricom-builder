import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/billing";
import { SUPPLIER_STATUSES } from "@/lib/finance";
import {
  extractPurchaseDocument,
  ZONE_FIELDS,
  type PurchaseLine,
} from "@/lib/purchase-ai.functions";

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60";
const btn =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[color:var(--brand-violet)]/50 hover:text-white";

type Zone = { id: string; field: string; x: number; y: number; w: number; h: number };

type Form = {
  id: string;
  supplier_name: string;
  supplier_ice: string;
  reference: string;
  issue_date: string;
  due_date: string;
  description: string;
  total_ht: number;
  vat_rate: number;
  total_vat: number;
  total_ttc: number;
  status: string;
  attachment_url: string;
  notes: string;
};

const emptyForm = (): Form => ({
  id: "",
  supplier_name: "",
  supplier_ice: "",
  reference: "",
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  description: "",
  total_ht: 0,
  vat_rate: 20,
  total_vat: 0,
  total_ttc: 0,
  status: "valide",
  attachment_url: "",
  notes: "",
});

type Row = Form & { created_at: string };

export function PurchaseInvoices() {
  const runAi = useServerFn(extractPurchaseDocument);

  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Form>(emptyForm());
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [draft, setDraft] = useState<Zone | null>(null);
  const [field, setField] = useState<string>("articles");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const load = async () => {
    const { data, error: e } = await supabase
      .from("supplier_invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => {
    void load();
  }, []);

  const isImage = !!file && file.type.startsWith("image/");

  const onFile = (f: File | null) => {
    setFile(f);
    setZones([]);
    setImgUrl(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  };

  // ---- dessin des zones (coordonnées en %) ----
  const rel = (e: React.MouseEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const down = (e: React.MouseEvent) => {
    if (!imgUrl) return;
    const p = rel(e);
    setDraft({ id: crypto.randomUUID(), field, x: p.x, y: p.y, w: 0, h: 0 });
  };
  const move = (e: React.MouseEvent) => {
    if (!draft) return;
    const p = rel(e);
    setDraft({ ...draft, w: p.x - draft.x, h: p.y - draft.y });
  };
  const up = () => {
    if (!draft) return;
    const z = {
      ...draft,
      x: Math.min(draft.x, draft.x + draft.w),
      y: Math.min(draft.y, draft.y + draft.h),
      w: Math.abs(draft.w),
      h: Math.abs(draft.h),
    };
    setDraft(null);
    if (z.w > 2 && z.h > 2) setZones((s) => [...s, z]);
  };

  const cropZone = (img: HTMLImageElement, z: Zone) => {
    const cw = (z.w / 100) * img.naturalWidth;
    const ch = (z.h / 100) * img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = Math.max(32, Math.round(cw));
    c.height = Math.max(32, Math.round(ch));
    const ctx = c.getContext("2d")!;
    ctx.drawImage(
      img,
      (z.x / 100) * img.naturalWidth,
      (z.y / 100) * img.naturalHeight,
      cw,
      ch,
      0,
      0,
      c.width,
      c.height,
    );
    return c.toDataURL("image/jpeg", 0.9);
  };

  const fullImage = (img: HTMLImageElement) => {
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  };

  const analyse = async () => {
    setError(null);
    setOk(null);
    const img = imgRef.current;
    if (!img) {
      setError("Ajoutez d'abord une image du document (JPG/PNG).");
      return;
    }
    setBusy("ai");
    try {
      const parts = [
        { field: "document", image: fullImage(img) },
        ...zones.map((z) => ({ field: ZONE_FIELDS.find((f) => f.key === z.field)?.label ?? z.field, image: cropZone(img, z) })),
      ];
      const r = await runAi({ data: { parts, note } });
      setForm((f) => ({
        ...f,
        supplier_name: r.supplier_name || f.supplier_name,
        supplier_ice: r.supplier_ice || f.supplier_ice,
        reference: r.reference || f.reference,
        issue_date: r.issue_date || f.issue_date,
        due_date: r.due_date || f.due_date,
        description: r.description || f.description,
        total_ht: r.total_ht,
        vat_rate: r.vat_rate,
        total_vat: r.total_vat,
        total_ttc: r.total_ttc,
      }));
      setLines(r.lines);
      setOk("Document lu par l'IA — vérifiez et corrigez si besoin.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible.");
    } finally {
      setBusy(null);
    }
  };

  const computed = useMemo(() => {
    const ht = lines.length ? lines.reduce((s, l) => s + Number(l.total || 0), 0) : Number(form.total_ht || 0);
    const vat = (ht * Number(form.vat_rate || 0)) / 100;
    return { ht, vat, ttc: ht + vat };
  }, [lines, form.total_ht, form.vat_rate]);

  const applyComputed = () =>
    setForm((f) => ({ ...f, total_ht: computed.ht, total_vat: computed.vat, total_ttc: computed.ttc }));

  const save = async () => {
    setError(null);
    setOk(null);
    if (!form.supplier_name.trim() || !form.reference.trim()) {
      setError("Le nom de société et le numéro du document sont obligatoires.");
      return;
    }
    setBusy("save");
    try {
      let attachment = form.attachment_url;
      if (file) {
        const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const up = await supabase.storage.from("purchases").upload(path, file, { upsert: true });
        if (up.error) throw new Error(up.error.message);
        attachment = path;
      }
      const payload = {
        supplier_name: form.supplier_name.trim(),
        supplier_ice: form.supplier_ice || null,
        doc_type: "facture_fournisseur",
        reference: form.reference.trim(),
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        description: form.description || null,
        total_ht: Number(form.total_ht || 0),
        vat_rate: Number(form.vat_rate || 0),
        total_vat: Number(form.total_vat || 0),
        total_ttc: Number(form.total_ttc || 0),
        status: form.status,
        attachment_url: attachment || null,
        notes: form.notes || null,
      };
      let id = form.id;
      if (id) {
        const r = await supabase.from("supplier_invoices").update(payload).eq("id", id);
        if (r.error) throw new Error(r.error.message);
        await supabase.from("supplier_invoice_lines").delete().eq("invoice_id", id);
      } else {
        const r = await supabase.from("supplier_invoices").insert(payload).select("id").single();
        if (r.error) throw new Error(r.error.message);
        id = r.data.id;
      }
      if (lines.length) {
        const r = await supabase.from("supplier_invoice_lines").insert(
          lines.map((l, i) => ({
            invoice_id: id,
            designation: l.designation || "Article",
            unit_price: Number(l.unit_price || 0),
            quantity: Number(l.quantity || 0),
            unit: l.unit || "U",
            total: Number(l.total || 0),
            sort_order: i,
          })),
        );
        if (r.error) throw new Error(r.error.message);
      }
      setOk("Facture d'achat enregistrée.");
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setForm(emptyForm());
    setLines([]);
    setZones([]);
    setFile(null);
    setImgUrl("");
  };

  const edit = async (r: Row) => {
    setForm({ ...emptyForm(), ...r, due_date: r.due_date ?? "", description: r.description ?? "", notes: r.notes ?? "" });
    setFile(null);
    setImgUrl("");
    setZones([]);
    const { data } = await supabase
      .from("supplier_invoice_lines")
      .select("designation, unit_price, quantity, unit, total")
      .eq("invoice_id", r.id)
      .order("sort_order");
    setLines(
      (data ?? []).map((l) => ({
        designation: l.designation,
        unit_price: Number(l.unit_price),
        quantity: Number(l.quantity),
        unit: l.unit ?? "U",
        total: Number(l.total),
      })),
    );
  };

  const remove = async (id: string) => {
    await supabase.from("supplier_invoices").delete().eq("id", id);
    await load();
  };

  const setLine = (i: number, patch: Partial<PurchaseLine>) =>
    setLines((ls) =>
      ls.map((l, k) => {
        if (k !== i) return l;
        const n = { ...l, ...patch };
        n.total = Number(n.unit_price || 0) * Number(n.quantity || 0);
        return n;
      }),
    );

  return (
    <div className="mt-4 space-y-4">
      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}
      {ok && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {ok}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Document + zones */}
        <div className="glass p-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className={`${btn} cursor-pointer`}>
              <Upload className="h-3.5 w-3.5" /> Joindre le document
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <select value={field} onChange={(e) => setField(e.target.value)} className={`${input} max-w-[200px]`}>
              {ZONE_FIELDS.filter((f) => f.key !== "document").map((f) => (
                <option key={f.key} value={f.key}>
                  Zone : {f.label}
                </option>
              ))}
            </select>
            <button onClick={() => setZones([])} className={btn}>
              <X className="h-3.5 w-3.5" /> Effacer les zones
            </button>
            <button onClick={() => void analyse()} disabled={busy === "ai"} className="btn-gradient ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50">
              {busy === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Remplir avec l'IA
            </button>
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Précision pour l'IA (facultatif) : ex. « TVA 14 %, lire le tableau du bas »"
            className={`${input} mt-3`}
          />

          <div
            ref={boxRef}
            onMouseDown={down}
            onMouseMove={move}
            onMouseUp={up}
            onMouseLeave={up}
            className="relative mt-3 min-h-[320px] select-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
          >
            {imgUrl ? (
              <img ref={imgRef} src={imgUrl} alt="Document d'achat" className="w-full" draggable={false} />
            ) : (
              <p className="p-8 text-center text-xs text-white/40">
                {file
                  ? "PDF joint : il sera enregistré avec la facture, mais la lecture IA par zones nécessite une image (JPG/PNG)."
                  : "Joignez une image du document puis dessinez des zones à la souris pour guider l'IA."}
              </p>
            )}
            {[...zones, ...(draft ? [draft] : [])].map((z) => (
              <div
                key={z.id}
                className="pointer-events-none absolute rounded border-2 border-[color:var(--brand-violet)] bg-[color:var(--brand-violet)]/15"
                style={{
                  left: `${Math.min(z.x, z.x + z.w)}%`,
                  top: `${Math.min(z.y, z.y + z.h)}%`,
                  width: `${Math.abs(z.w)}%`,
                  height: `${Math.abs(z.h)}%`,
                }}
              >
                <span className="absolute -top-5 left-0 rounded bg-[color:var(--brand-violet)] px-1.5 text-[10px] font-semibold text-white">
                  {ZONE_FIELDS.find((f) => f.key === z.field)?.label ?? z.field}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="glass space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Nom de société</span>
              <input className={input} value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">ICE</span>
              <input className={input} value={form.supplier_ice} onChange={(e) => setForm({ ...form, supplier_ice: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">N° document</span>
              <input className={input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Date</span>
              <input type="date" className={input} value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Échéance</span>
              <input type="date" className={input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Statut</span>
              <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {SUPPLIER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Objet</span>
            <input className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div className="rounded-xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-xs font-semibold text-white/70">Articles</span>
              <button
                className={btn}
                onClick={() => setLines((l) => [...l, { designation: "", unit_price: 0, quantity: 1, unit: "U", total: 0 }])}
              >
                <Plus className="h-3.5 w-3.5" /> Ligne
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto p-3">
              {lines.length === 0 && <p className="text-xs text-white/40">Aucun article — l'IA les remplira, ou ajoutez-les à la main.</p>}
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    className={`${input} col-span-5`}
                    placeholder="Désignation"
                    value={l.designation}
                    onChange={(e) => setLine(i, { designation: e.target.value })}
                  />
                  <input
                    className={`${input} col-span-2`}
                    type="number"
                    placeholder="P.U."
                    value={l.unit_price}
                    onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })}
                  />
                  <input
                    className={`${input} col-span-2`}
                    type="number"
                    placeholder="Qté"
                    value={l.quantity}
                    onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                  />
                  <div className="col-span-2 flex items-center justify-end text-xs text-white/70">{money(l.total)}</div>
                  <button
                    className="col-span-1 text-white/40 hover:text-rose-300"
                    onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Total HT</span>
              <input type="number" className={input} value={form.total_ht} onChange={(e) => setForm({ ...form, total_ht: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">TVA %</span>
              <input type="number" className={input} value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">TVA</span>
              <input type="number" className={input} value={form.total_vat} onChange={(e) => setForm({ ...form, total_vat: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Total TTC</span>
              <input type="number" className={input} value={form.total_ttc} onChange={(e) => setForm({ ...form, total_ttc: Number(e.target.value) })} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className={btn} onClick={applyComputed}>
              Recalculer depuis les articles ({money(computed.ttc)})
            </button>
            <button className={btn} onClick={reset}>
              Nouveau
            </button>
            <button
              onClick={() => void save()}
              disabled={busy === "save"}
              className="btn-gradient ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {busy === "save" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Enregistrer l'achat
            </button>
          </div>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="border-b border-white/5 px-5 py-4 text-sm font-semibold text-white">Factures d'achat</div>
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-5 py-3">N°</th>
              <th className="px-5 py-3">Société</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">TTC</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-white/80">
                <td className="px-5 py-3">{r.reference}</td>
                <td className="px-5 py-3">{r.supplier_name ?? "—"}</td>
                <td className="px-5 py-3">{r.issue_date}</td>
                <td className="px-5 py-3">{money(Number(r.total_ttc || 0))}</td>
                <td className="px-5 py-3">{SUPPLIER_STATUSES.find((s) => s.value === r.status)?.label ?? r.status}</td>
                <td className="px-5 py-3 text-right">
                  <button className={btn} onClick={() => void edit(r)}>
                    Modifier
                  </button>
                  <button className="ml-2 text-white/40 hover:text-rose-300" onClick={() => void remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-xs text-white/40">
                  Aucune facture d'achat pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
