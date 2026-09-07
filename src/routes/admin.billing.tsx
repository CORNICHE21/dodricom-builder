import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Download,
  FileText,
  Loader2,
  Plus,
  Printer,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_PRINT_OPTIONS,
  InvoiceDocument,
  type PrintOptions,
} from "@/components/admin/InvoiceDocument";
import {
  computeTotals,
  DOC_TYPES,
  docLabel,
  money,
  nextNumber,
  PAYMENT_METHODS,
  STATUSES,
  type BillingDoc,
  type BillingSettings,
  type DocLine,
  type DocStatus,
  type DocType,
  type Payment,
} from "@/lib/billing";

export const Route = createFileRoute("/admin/billing")({
  component: BillingPage,
});

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60";
const btn =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[color:var(--brand-violet)]/50 hover:text-white";

type Tab = "documents" | "editor" | "achats" | "settings";

const emptyDoc = (type: DocType = "facture"): BillingDoc => ({
  id: "",
  doc_type: type,
  number: "",
  status: "brouillon",
  client_name: "",
  client_address: "",
  client_ice: "",
  client_email: "",
  client_phone: "",
  order_ref: "",
  city: "Casablanca",
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: null,
  intro_text:
    "Suite à votre consultation dont nous vous remercions, veuillez trouver ci-dessous notre meilleure offre de tarif pour les prestations demandées :",
  vat_rate: 20,
  discount: 0,
  deposit: 0,
  total_ht: 0,
  total_vat: 0,
  total_ttc: 0,
  net_to_pay: 0,
  terms: null,
  notes: null,
  source_document_id: null,
  created_at: new Date().toISOString(),
});

const emptyLine = (order: number): DocLine => ({
  section: "",
  designation: "",
  unit_price: 0,
  quantity: 1,
  unit: "F",
  total: 0,
  sort_order: order,
});

function BillingPage() {
  const [tab, setTab] = useState<Tab>("documents");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [doc, setDoc] = useState<BillingDoc>(emptyDoc());
  const [lines, setLines] = useState<DocLine[]>([emptyLine(0)]);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [preview, setPreview] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);

  const loadAll = async () => {
    const [s, d, p] = await Promise.all([
      supabase.from("billing_settings").select("*").limit(1).maybeSingle(),
      supabase.from("billing_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("billing_payments").select("*").order("paid_at", { ascending: false }),
    ]);
    if (s.error) setError(s.error.message);
    setSettings((s.data as BillingSettings) ?? null);
    setDocs((d.data as BillingDoc[]) ?? []);
    setPayments((p.data as Payment[]) ?? []);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const totals = useMemo(
    () => computeTotals(lines, doc.vat_rate, doc.discount, doc.deposit),
    [lines, doc.vat_rate, doc.discount, doc.deposit],
  );

  const docPayments = payments.filter((p) => p.document_id === doc.id);
  const paidAmount = docPayments.reduce((s, p) => s + Number(p.amount), 0);

  const paidFor = (id: string) =>
    payments.filter((p) => p.document_id === id).reduce((s, p) => s + Number(p.amount), 0);

  // ---- actions --------------------------------------------------------
  const newDoc = (type: DocType = "facture") => {
    const d = emptyDoc(type);
    d.number = nextNumber(
      type,
      docs.filter((x) => x.doc_type === type).map((x) => x.number),
    );
    d.vat_rate = settings?.default_vat ?? 20;
    d.terms = settings?.terms ?? null;
    setDoc(d);
    setLines([emptyLine(0)]);
    setTab("editor");
  };

  const openDoc = async (d: BillingDoc) => {
    setError(null);
    const { data, error: err } = await supabase
      .from("billing_document_lines")
      .select("*")
      .eq("document_id", d.id)
      .order("sort_order");
    if (err) return setError(err.message);
    setDoc(d);
    setLines(((data as DocLine[]) ?? []).length ? (data as DocLine[]) : [emptyLine(0)]);
    setTab("editor");
  };

  const saveDoc = async () => {
    if (!doc.client_name.trim()) return setError("Le nom du client est obligatoire.");
    setBusy(true);
    setError(null);
    const payload = {
      doc_type: doc.doc_type,
      number: doc.number || nextNumber(doc.doc_type, docs.map((x) => x.number)),
      status: doc.status,
      client_name: doc.client_name,
      client_address: doc.client_address,
      client_ice: doc.client_ice,
      client_email: doc.client_email,
      client_phone: doc.client_phone,
      order_ref: doc.order_ref,
      city: doc.city,
      issue_date: doc.issue_date,
      due_date: doc.due_date,
      intro_text: doc.intro_text,
      vat_rate: doc.vat_rate,
      discount: doc.discount,
      deposit: doc.deposit,
      total_ht: totals.totalHt,
      total_vat: totals.totalVat,
      total_ttc: totals.totalTtc,
      net_to_pay: totals.netToPay,
      terms: doc.terms,
      notes: doc.notes,
      source_document_id: doc.source_document_id,
    };
    let id = doc.id;
    if (id) {
      const { error: err } = await supabase.from("billing_documents").update(payload).eq("id", id);
      if (err) {
        setBusy(false);
        return setError(err.message);
      }
    } else {
      const { data, error: err } = await supabase
        .from("billing_documents")
        .insert(payload)
        .select("id")
        .single();
      if (err || !data) {
        setBusy(false);
        return setError(err?.message ?? "Erreur d'enregistrement.");
      }
      id = data.id;
    }
    await supabase.from("billing_document_lines").delete().eq("document_id", id);
    const rows = lines
      .filter((l) => l.designation.trim() || Number(l.unit_price) > 0)
      .map((l, i) => ({
        document_id: id,
        section: l.section || null,
        designation: l.designation,
        unit_price: Number(l.unit_price) || 0,
        quantity: Number(l.quantity) || 0,
        unit: l.unit,
        total: (Number(l.unit_price) || 0) * (Number(l.quantity) || 0),
        sort_order: i,
      }));
    if (rows.length) {
      const { error: lerr } = await supabase.from("billing_document_lines").insert(rows);
      if (lerr) setError(lerr.message);
    }
    await loadAll();
    const saved = { ...doc, id, ...payload } as BillingDoc;
    setDoc(saved);
    setBusy(false);
  };

  const convertTo = async (target: DocType) => {
    if (!doc.id) return setError("Enregistrez d'abord ce document.");
    setBusy(true);
    const number = nextNumber(
      target,
      docs.filter((x) => x.doc_type === target).map((x) => x.number),
    );
    const { data, error: err } = await supabase
      .from("billing_documents")
      .insert({
        doc_type: target,
        number,
        status: "brouillon",
        client_name: doc.client_name,
        client_address: doc.client_address,
        client_ice: doc.client_ice,
        client_email: doc.client_email,
        client_phone: doc.client_phone,
        order_ref: doc.order_ref,
        city: doc.city,
        issue_date: new Date().toISOString().slice(0, 10),
        intro_text: doc.intro_text,
        vat_rate: doc.vat_rate,
        discount: doc.discount,
        deposit: doc.deposit,
        total_ht: doc.total_ht,
        total_vat: doc.total_vat,
        total_ttc: doc.total_ttc,
        net_to_pay: doc.net_to_pay,
        terms: doc.terms,
        source_document_id: doc.id,
      })
      .select("*")
      .single();
    if (err || !data) {
      setBusy(false);
      return setError(err?.message ?? "Conversion impossible.");
    }
    const rows = lines
      .filter((l) => l.designation.trim())
      .map((l, i) => ({
        document_id: data.id,
        section: l.section || null,
        designation: l.designation,
        unit_price: Number(l.unit_price),
        quantity: Number(l.quantity),
        unit: l.unit,
        total: Number(l.unit_price) * Number(l.quantity),
        sort_order: i,
      }));
    if (rows.length) await supabase.from("billing_document_lines").insert(rows);
    await loadAll();
    setBusy(false);
    await openDoc(data as BillingDoc);
  };

  const deleteDoc = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce document ?")) return;
    await supabase.from("billing_documents").delete().eq("id", id);
    if (doc.id === id) newDoc();
    await loadAll();
  };

  const addPayment = async (p: { paid_at: string; amount: number; method: string; reference: string }) => {
    if (!doc.id) return setError("Enregistrez d'abord ce document.");
    const { error: err } = await supabase.from("billing_payments").insert({
      document_id: doc.id,
      paid_at: p.paid_at,
      amount: p.amount,
      method: p.method,
      reference: p.reference || null,
    });
    if (err) return setError(err.message);
    const newPaid = paidAmount + p.amount;
    const status: DocStatus =
      newPaid >= Number(doc.net_to_pay) - 0.01 ? "paye" : newPaid > 0 ? "partiel" : doc.status;
    await supabase.from("billing_documents").update({ status }).eq("id", doc.id);
    setDoc((d) => ({ ...d, status }));
    await loadAll();
  };

  const removePayment = async (id: string) => {
    await supabase.from("billing_payments").delete().eq("id", id);
    await loadAll();
  };

  const uploadAsset = async (kind: "logo_url" | "letterhead_url" | "stamp_url", file: File) => {
    setError(null);
    const path = `billing/${kind}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const up = await supabase.storage.from("cms").upload(path, file, { upsert: true });
    if (up.error) return setError(up.error.message);
    const signed = await supabase.storage.from("cms").createSignedUrl(path, 60 * 60 * 24 * 3650);
    const url = signed.data?.signedUrl;
    if (!url || !settings) return setError(signed.error?.message ?? "URL introuvable.");
    const patch = { [kind]: url } as Partial<BillingSettings>;
    const { error: err } = await supabase
      .from("billing_settings")
      .update(patch)
      .eq("id", settings.id);

    if (err) return setError(err.message);
    setSettings({ ...settings, [kind]: url });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setBusy(true);
    const { id, ...rest } = settings;
    const { error: err } = await supabase.from("billing_settings").update(rest).eq("id", id);
    if (err) setError(err.message);
    setBusy(false);
  };

  const filtered = docs.filter(
    (d) =>
      (filterType === "all" || d.doc_type === filterType) &&
      (filterStatus === "all" || d.status === filterStatus) &&
      (!search ||
        d.number.toLowerCase().includes(search.toLowerCase()) ||
        d.client_name.toLowerCase().includes(search.toLowerCase())),
  );

  const totalInvoiced = docs
    .filter((d) => d.doc_type === "facture")
    .reduce((s, d) => s + Number(d.total_ttc), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <AdminShell title="Facturation" breadcrumbs={[{ label: "Facturation" }]}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents" value={String(docs.length)} icon={FileText} />
        <StatCard label="Facturé (TTC)" value={money(totalInvoiced)} icon={FileText} />
        <StatCard label="Encaissé" value={money(totalPaid)} icon={Wallet} />
        <StatCard label="Restant dû" value={money(Math.max(0, totalInvoiced - totalPaid))} icon={Wallet} />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["documents", "editor", "achats", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === t ? "btn-gradient" : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
            }`}
          >
            {t === "documents"
              ? "Documents"
              : t === "editor"
                ? "Éditeur"
                : t === "achats"
                  ? "Achats (IA)"
                  : "Paramètres"}
          </button>
        ))}
        <button onClick={() => newDoc()} className={`${btn} ml-auto`}>
          <Plus className="h-3.5 w-3.5" /> Nouveau document
        </button>
      </div>

      {tab === "achats" && <PurchaseInvoices />}

      {tab === "documents" && (
        <div className="mt-4 glass overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-4">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`${input} max-w-[180px]`}>
              <option value="all">Tous les types</option>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`${input} max-w-[180px]`}
            >
              <option value="all">Tous les statuts</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (numéro, client)"
              className={`${input} max-w-[260px]`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-white/45">
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total TTC</th>
                  <th className="px-5 py-3">Réglé</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const st = STATUSES.find((s) => s.value === d.status);
                  return (
                    <tr key={d.id} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-white">{d.number}</div>
                        <div className="text-xs text-white/45">{docLabel(d.doc_type)}</div>
                      </td>
                      <td className="px-5 py-3 text-white/80">{d.client_name}</td>
                      <td className="px-5 py-3 text-white/60">
                        {new Date(d.issue_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3 text-white/80">{money(d.total_ttc, settings?.currency)}</td>
                      <td className="px-5 py-3 text-white/60">{money(paidFor(d.id), settings?.currency)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${st?.cls}`}>
                          {st?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => void openDoc(d)} className={btn}>
                            Ouvrir
                          </button>
                          <button
                            onClick={async () => {
                              await openDoc(d);
                              setPreview(true);
                            }}
                            className={btn}
                          >
                            <Printer className="h-3.5 w-3.5" /> PDF
                          </button>
                          <button
                            onClick={() => void deleteDoc(d.id)}
                            className="rounded-xl border border-rose-400/30 px-2 py-2 text-xs text-rose-200 hover:bg-rose-400/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-white/40">
                      Aucun document. Cliquez sur « Nouveau document » pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "editor" && (
        <div className="mt-4 space-y-4">
          <div className="glass p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-[11px] text-white/50">
                Type
                <select
                  value={doc.doc_type}
                  onChange={(e) => {
                    const t = e.target.value as DocType;
                    setDoc((d) => ({
                      ...d,
                      doc_type: t,
                      number: d.id
                        ? d.number
                        : nextNumber(t, docs.filter((x) => x.doc_type === t).map((x) => x.number)),
                    }));
                  }}
                  className={input}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-white/50">
                Numéro
                <input value={doc.number} onChange={(e) => setDoc((d) => ({ ...d, number: e.target.value }))} className={input} />
              </label>
              <label className="text-[11px] text-white/50">
                Date
                <input
                  type="date"
                  value={doc.issue_date}
                  onChange={(e) => setDoc((d) => ({ ...d, issue_date: e.target.value }))}
                  className={input}
                />
              </label>
              <label className="text-[11px] text-white/50">
                Statut
                <select
                  value={doc.status}
                  onChange={(e) => setDoc((d) => ({ ...d, status: e.target.value as DocStatus }))}
                  className={input}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input
                placeholder="Nom du client"
                value={doc.client_name}
                onChange={(e) => setDoc((d) => ({ ...d, client_name: e.target.value }))}
                className={input}
              />
              <input
                placeholder="Adresse du client"
                value={doc.client_address ?? ""}
                onChange={(e) => setDoc((d) => ({ ...d, client_address: e.target.value }))}
                className={input}
              />
              <input
                placeholder="ICE client"
                value={doc.client_ice ?? ""}
                onChange={(e) => setDoc((d) => ({ ...d, client_ice: e.target.value }))}
                className={input}
              />
              <input
                placeholder="Bon de commande"
                value={doc.order_ref ?? ""}
                onChange={(e) => setDoc((d) => ({ ...d, order_ref: e.target.value }))}
                className={input}
              />
              <input
                placeholder="Ville"
                value={doc.city ?? ""}
                onChange={(e) => setDoc((d) => ({ ...d, city: e.target.value }))}
                className={input}
              />
              <input
                placeholder="Email client"
                value={doc.client_email ?? ""}
                onChange={(e) => setDoc((d) => ({ ...d, client_email: e.target.value }))}
                className={input}
              />
            </div>

            <textarea
              value={doc.intro_text ?? ""}
              onChange={(e) => setDoc((d) => ({ ...d, intro_text: e.target.value }))}
              placeholder="Texte d'introduction"
              className={`${input} mt-3 h-20 resize-none`}
            />
          </div>

          <div className="glass p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Lignes du document</h2>
              <button onClick={() => setLines((l) => [...l, emptyLine(l.length)])} className={btn}>
                <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[140px_1fr_120px_90px_90px_40px]">
                  <input
                    placeholder="Section"
                    value={l.section}
                    onChange={(e) =>
                      setLines((p) => p.map((x, j) => (j === i ? { ...x, section: e.target.value } : x)))
                    }
                    className={input}
                  />
                  <input
                    placeholder="Désignation"
                    value={l.designation}
                    onChange={(e) =>
                      setLines((p) => p.map((x, j) => (j === i ? { ...x, designation: e.target.value } : x)))
                    }
                    className={input}
                  />
                  <input
                    type="number"
                    placeholder="Prix U HT"
                    value={l.unit_price}
                    onChange={(e) =>
                      setLines((p) => p.map((x, j) => (j === i ? { ...x, unit_price: Number(e.target.value) } : x)))
                    }
                    className={input}
                  />
                  <input
                    type="number"
                    placeholder="Qté"
                    value={l.quantity}
                    onChange={(e) =>
                      setLines((p) => p.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))
                    }
                    className={input}
                  />
                  <input
                    placeholder="Unité"
                    value={l.unit}
                    onChange={(e) => setLines((p) => p.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))}
                    className={input}
                  />
                  <button
                    onClick={() => setLines((p) => p.filter((_, j) => j !== i))}
                    className="rounded-xl border border-rose-400/30 text-rose-200 hover:bg-rose-400/10"
                  >
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <label className="text-[11px] text-white/50">
                Taux TVA (%)
                <input
                  type="number"
                  value={doc.vat_rate}
                  onChange={(e) => setDoc((d) => ({ ...d, vat_rate: Number(e.target.value) }))}
                  className={input}
                />
              </label>
              <label className="text-[11px] text-white/50">
                Remise (HT)
                <input
                  type="number"
                  value={doc.discount}
                  onChange={(e) => setDoc((d) => ({ ...d, discount: Number(e.target.value) }))}
                  className={input}
                />
              </label>
              <label className="text-[11px] text-white/50">
                Acompte (TTC)
                <input
                  type="number"
                  value={doc.deposit}
                  onChange={(e) => setDoc((d) => ({ ...d, deposit: Number(e.target.value) }))}
                  className={input}
                />
              </label>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
                <p>Total HT : {money(totals.totalHt, settings?.currency)}</p>
                <p>TVA : {money(totals.totalVat, settings?.currency)}</p>
                <p>Total TTC : {money(totals.totalTtc, settings?.currency)}</p>
                <p className="mt-1 font-semibold text-white">
                  Net à payer : {money(totals.netToPay, settings?.currency)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => void saveDoc()} disabled={busy} className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
              </button>
              <button onClick={() => setPreview(true)} className={btn}>
                <Printer className="h-3.5 w-3.5" /> Aperçu / Export PDF
              </button>
              {doc.id && (
                <>
                  <span className="text-[11px] text-white/40">Convertir en :</span>
                  {DOC_TYPES.filter((t) => t.value !== doc.doc_type).map((t) => (
                    <button key={t.value} onClick={() => void convertTo(t.value)} className={btn}>
                      <ArrowRightLeft className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  ))}
                </>
              )}
            </div>
            {doc.source_document_id && (
              <p className="mt-2 text-[11px] text-white/40">
                Créé à partir de :{" "}
                {docs.find((x) => x.id === doc.source_document_id)?.number ?? "document d'origine"}
              </p>
            )}
          </div>

          {doc.id && (
            <PaymentsPanel
              payments={docPayments}
              netToPay={Number(doc.net_to_pay || totals.netToPay)}
              paid={paidAmount}
              currency={settings?.currency ?? "MAD"}
              onAdd={addPayment}
              onRemove={removePayment}
            />
          )}
        </div>
      )}

      {tab === "settings" && settings && (
        <div className="mt-4 glass p-6">
          <h2 className="text-sm font-semibold text-white">Identité de l'entreprise</h2>
          <p className="mb-4 text-xs text-white/50">
            Ces informations et ces visuels sont utilisés dans tous les documents générés.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {(
              [
                ["company_name", "Raison sociale"],
                ["address", "Adresse"],
                ["phone", "Téléphone"],
                ["email", "Email"],
                ["website", "Site web"],
                ["ice", "ICE"],
                ["rc", "R.C"],
                ["if_number", "I.F"],
                ["patente", "Patente"],
                ["rib", "RIB"],
                ["capital", "Capital"],
                ["currency", "Devise"],
              ] as [keyof BillingSettings, string][]
            ).map(([key, label]) => (
              <label key={String(key)} className="text-[11px] text-white/50">
                {label}
                <input
                  value={(settings[key] as string) ?? ""}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className={input}
                />
              </label>
            ))}
            <label className="text-[11px] text-white/50">
              TVA par défaut (%)
              <input
                type="number"
                value={settings.default_vat}
                onChange={(e) => setSettings({ ...settings, default_vat: Number(e.target.value) })}
                className={input}
              />
            </label>
          </div>
          <label className="mt-3 block text-[11px] text-white/50">
            Conditions commerciales
            <textarea
              value={settings.terms ?? ""}
              onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
              className={`${input} h-24 resize-none`}
            />
          </label>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(
              [
                ["logo_url", "Logo"],
                ["letterhead_url", "Papier en-tête"],
                ["stamp_url", "Cachet / signature"],
              ] as ["logo_url" | "letterhead_url" | "stamp_url", string][]
            ).map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
                <div className="mb-3 grid h-28 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {settings[key] ? (
                    <img src={settings[key] as string} alt={label} className="max-h-28 object-contain" />
                  ) : (
                    <span className="text-xs text-white/30">Aucun fichier</span>
                  )}
                </div>
                <label className={`${btn} cursor-pointer`}>
                  <Download className="h-3.5 w-3.5" /> Téléverser
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadAsset(key, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={() => void saveSettings()}
            disabled={busy}
            className="btn-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer les paramètres
          </button>
        </div>
      )}

      {preview && (
<div className="print-modal fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="print-modal mx-auto max-w-[230mm]">
            <div className="no-print sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/80 p-3">
              {(
                [
                  ["logo", "Logo"],
                  ["letterhead", "Papier en-tête"],
                  ["stamp", "Cachet"],
                  ["terms", "Conditions"],
                  ["footer", "Pied de page"],
                ] as [keyof PrintOptions, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={printOptions[key]}
                    onChange={(e) => setPrintOptions((p) => ({ ...p, [key]: e.target.checked }))}
                    className="h-3.5 w-3.5 accent-[color:var(--brand-violet)]"
                  />
                  {label}
                </label>
              ))}
              <button onClick={() => window.print()} className="btn-gradient ml-auto rounded-xl px-4 py-2 text-xs font-semibold">
                <Printer className="mr-2 inline h-3.5 w-3.5" /> Exporter en PDF
              </button>
              <button onClick={() => setPreview(false)} className={btn}>
                <X className="h-3.5 w-3.5" /> Fermer
              </button>
            </div>
            <InvoiceDocument
              doc={{ ...doc, ...totals && {
                total_ht: totals.totalHt,
                total_vat: totals.totalVat,
                total_ttc: totals.totalTtc,
                net_to_pay: totals.netToPay,
              } }}
              lines={lines}
              settings={settings}
              options={printOptions}
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function PaymentsPanel({
  payments,
  netToPay,
  paid,
  currency,
  onAdd,
  onRemove,
}: {
  payments: Payment[];
  netToPay: number;
  paid: number;
  currency: string;
  onAdd: (p: { paid_at: string; amount: number; method: string; reference: string }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState({
    paid_at: new Date().toISOString().slice(0, 10),
    amount: 0,
    method: "virement",
    reference: "",
  });

  return (
    <div className="glass p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Suivi des paiements</h2>
        <div className="text-xs text-white/60">
          Réglé : <span className="text-emerald-300">{money(paid, currency)}</span> · Restant dû :{" "}
          <span className="text-amber-200">{money(Math.max(0, netToPay - paid), currency)}</span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        <input
          type="date"
          value={form.paid_at}
          onChange={(e) => setForm((p) => ({ ...p, paid_at: e.target.value }))}
          className={input}
        />
        <input
          type="number"
          placeholder="Montant"
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
          className={input}
        />
        <select value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))} className={input}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          placeholder="Référence"
          value={form.reference}
          onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
          className={input}
        />
        <button
          onClick={() => {
            if (form.amount > 0) void onAdd(form).then(() => setForm((p) => ({ ...p, amount: 0, reference: "" })));
          }}
          className="btn-gradient rounded-xl px-4 py-2.5 text-xs font-semibold"
        >
          Ajouter le règlement
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white/70"
          >
            <span>{new Date(p.paid_at).toLocaleDateString("fr-FR")}</span>
            <span className="font-semibold text-white">{money(p.amount, currency)}</span>
            <span>{p.method}</span>
            <span className="min-w-0 flex-1 truncate text-white/40">{p.reference ?? ""}</span>
            <button onClick={() => void onRemove(p.id)} className="text-rose-300 hover:text-rose-200">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!payments.length && <p className="text-xs text-white/40">Aucun règlement enregistré.</p>}
      </div>
    </div>
  );
}
