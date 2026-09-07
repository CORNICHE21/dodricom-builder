import { Fragment } from "react";
import {
  amountInWords,
  docTitle,
  formatDateFr,
  money,
  type BillingDoc,
  type BillingSettings,
  type DocLine,
} from "@/lib/billing";

export type PrintOptions = {
  logo: boolean;
  letterhead: boolean;
  stamp: boolean;
  terms: boolean;
  footer: boolean;
};

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  logo: true,
  letterhead: false,
  stamp: true,
  terms: true,
  footer: true,
};

const NAVY = "#152452";
const CYAN = "#63c9dd";

type RowItem =
  | { kind: "section"; label: string }
  | { kind: "line"; line: DocLine };

/** Poids approximatif (en « unités de ligne ») de chaque élément du tableau. */
const WEIGHT_SECTION = 1.4;
const WEIGHT_LINE = 1;

/** Capacités approximatives d'une page A4 (en unités de ligne). */
const CAPACITY_FIRST = 15; // page 1 : header + date + texte d'intro
const CAPACITY_NEXT = 24; // pages suivantes : header réduit
const TOTALS_WEIGHT = 9; // place occupée par le bloc totaux / net à payer / conditions

function buildItems(lines: DocLine[]): RowItem[] {
  const items: RowItem[] = [];
  let current: string | null = null;
  for (const line of lines) {
    const section = line.section?.trim() || "";
    if (section && section !== current) {
      items.push({ kind: "section", label: section });
      current = section;
    }
    if (!section) current = "";
    items.push({ kind: "line", line });
  }
  return items;
}

/** Découpe les lignes en pages A4, la dernière contenant le bloc des totaux. */
function paginate(items: RowItem[]): RowItem[][] {
  const pages: RowItem[][] = [];
  let page: RowItem[] = [];
  let used = 0;
  let capacity = CAPACITY_FIRST;

  for (const item of items) {
    const weight = item.kind === "section" ? WEIGHT_SECTION : WEIGHT_LINE;
    if (used + weight > capacity && page.length) {
      pages.push(page);
      page = [];
      used = 0;
      capacity = CAPACITY_NEXT;
    }
    page.push(item);
    used += weight;
  }
  pages.push(page);

  // La dernière page doit pouvoir accueillir le bloc des totaux.
  const lastCapacity = pages.length === 1 ? CAPACITY_FIRST : CAPACITY_NEXT;
  const lastUsed = pages[pages.length - 1]!.reduce(
    (sum, item) => sum + (item.kind === "section" ? WEIGHT_SECTION : WEIGHT_LINE),
    0,
  );
  if (lastUsed + TOTALS_WEIGHT > lastCapacity) pages.push([]);

  return pages;
}

/**
 * Document administratif A4 paginé.
 * Chaque page reprend le logo / papier en-tête, les informations client et le
 * pied de page ; seule la dernière page porte les totaux, les conditions et le cachet.
 */
export function InvoiceDocument({
  doc,
  lines,
  settings,
  options,
}: {
  doc: BillingDoc;
  lines: DocLine[];
  settings: BillingSettings | null;
  options: PrintOptions;
}) {
  const currency = settings?.currency ?? "MAD";
  const pages = paginate(buildItems(lines.filter((l) => l.designation?.trim() || Number(l.unit_price))));

  return (
    <div className="print-root flex flex-col items-center gap-6">
      {pages.map((items, pageIndex) => (
        <Page
          key={pageIndex}
          doc={doc}
          settings={settings}
          options={options}
          currency={currency}
          items={items}
          first={pageIndex === 0}
          last={pageIndex === pages.length - 1}
          index={pageIndex + 1}
          count={pages.length}
        />
      ))}
    </div>
  );
}

function Page({
  doc,
  settings,
  options,
  currency,
  items,
  first,
  last,
  index,
  count,
}: {
  doc: BillingDoc;
  settings: BillingSettings | null;
  options: PrintOptions;
  currency: string;
  items: RowItem[];
  first: boolean;
  last: boolean;
  index: number;
  count: number;
}) {
  return (
    <div
      className="print-page relative mx-auto flex flex-col bg-white text-[#1a1a1a]"
      style={{
        width: "210mm",
        height: "297mm",
        backgroundColor: "#ffffff",
        fontFamily: "Georgia, 'Times New Roman', serif",
        overflow: "hidden",
      }}
    >
      {/* ---------- HEADER ---------- */}
      <div
        className="relative shrink-0"
        style={{
          minHeight: first ? "48mm" : "38mm",
          backgroundColor: options.letterhead ? "transparent" : "#ffffff",
          overflow: "hidden",
        }}
      >
        {options.letterhead && settings?.letterhead_url && (
          <div
            className="absolute left-0 top-0 w-full overflow-hidden"
            style={{ height: first ? "48mm" : "38mm", zIndex: 0 }}
          >
            <img
              src={settings.letterhead_url}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                objectPosition: "top center",
              }}
            />
          </div>
        )}

        <div
          className="relative z-10 flex items-start justify-between gap-6 px-8"
          style={{ paddingTop: "7mm", paddingBottom: "5mm" }}
        >
          <div className="flex min-w-0 flex-1 items-start" style={{ minHeight: first ? "32mm" : "24mm" }}>
            {options.logo && settings?.logo_url && (
              <img
                src={settings.logo_url}
                alt=""
                style={{
                  height: first ? "32mm" : "24mm",
                  width: "auto",
                  maxWidth: "85mm",
                  objectFit: "contain",
                  objectPosition: "left center",
                  display: "block",
                  position: "relative",
                  zIndex: 20,
                }}
              />
            )}
          </div>

          <div
            className="shrink-0 text-center"
            style={{ width: "82mm", marginLeft: "auto", paddingTop: "3mm", position: "relative", zIndex: 10 }}
          >
            <p
              className="text-[19px] font-bold"
              style={{ color: "#111111", lineHeight: "1.2", whiteSpace: "nowrap" }}
            >
              {docTitle(doc.doc_type)} N° {doc.number}
            </p>
            <p
              className="mt-1 text-[13px] font-bold"
              style={{ color: "#111111", lineHeight: "1.35", whiteSpace: "nowrap" }}
            >
              {doc.client_name}
            </p>
            {doc.client_address && (
              <p className="text-[11px]" style={{ color: "#111111", lineHeight: "1.4", whiteSpace: "nowrap" }}>
                {doc.client_address}
              </p>
            )}
            {doc.client_ice && (
              <p
                className="mt-1 text-[12px] font-bold"
                style={{ color: "#111111", lineHeight: "1.35", whiteSpace: "nowrap" }}
              >
                ICE&nbsp;&nbsp;{doc.client_ice}
              </p>
            )}
            {doc.order_ref && (
              <p className="text-[12px]" style={{ color: "#111111", lineHeight: "1.4", whiteSpace: "nowrap" }}>
                Bon de Commande : {doc.order_ref}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- CORPS ---------- */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-8 pb-4" style={{ backgroundColor: "#ffffff" }}>
        {first && (
          <>
            <div className="mt-2 flex justify-end">
              <span
                className="rounded-full px-6 py-1.5 text-[13px] font-bold text-white"
                style={{ background: CYAN }}
              >
                {(doc.city || "Casablanca") + ", " + formatDateFr(doc.issue_date)}
              </span>
            </div>
            {doc.intro_text && (
              <p className="mt-4 text-[12.5px] leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
                {doc.intro_text}
              </p>
            )}
          </>
        )}

        {items.length > 0 && (
          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr style={{ background: "#bfe4ee" }}>
                <th className="rounded-l-xl px-3 py-2.5 text-left font-bold">Désignation</th>
                <th className="px-3 py-2.5 text-center font-bold">
                  Prix U
                  <br />
                  HT ({currency})
                </th>
                <th className="px-3 py-2.5 text-center font-bold">Qté</th>
                <th className="rounded-r-xl px-3 py-2.5 text-center font-bold">
                  Prix Total
                  <br />
                  HT ({currency})
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) =>
                item.kind === "section" ? (
                  <tr key={`s-${i}`}>
                    <td
                      className="px-3 pt-4 pb-1 text-[13px] font-bold"
                      style={{ color: "#3aa3bd", borderRight: `1px solid ${CYAN}` }}
                    >
                      {item.label}
                    </td>
                    <td className="pt-4 pb-1" style={{ borderRight: `1px solid ${CYAN}` }} />
                    <td className="pt-4 pb-1" style={{ borderRight: `1px solid ${CYAN}` }} />
                    <td className="pt-4 pb-1" />
                  </tr>
                ) : (
                  <tr key={item.line.id ?? `l-${i}`}>
                    <td className="px-3 py-2 font-semibold" style={{ borderRight: `1px solid ${CYAN}` }}>
                      {item.line.designation}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ borderRight: `1px solid ${CYAN}` }}>
                      {Number(item.line.unit_price).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ borderRight: `1px solid ${CYAN}` }}>
                      {item.line.unit && item.line.unit !== "" ? item.line.unit : item.line.quantity}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {(Number(item.line.unit_price) * Number(item.line.quantity)).toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}

        <div className="flex-1" />

        {last && (
          <div className="mt-6 flex items-start justify-between gap-6">
            <div className="flex-1">
              <table className="w-full border-collapse text-center text-[11.5px]">
                <thead>
                  <tr style={{ background: "#bfe4ee" }}>
                    <th className="rounded-l-lg px-2 py-1.5">Total HT</th>
                    <th className="px-2 py-1.5">Taux TVA</th>
                    <th className="px-2 py-1.5">TVA</th>
                    <th className="px-2 py-1.5">Total TTC</th>
                    <th className="rounded-r-lg px-2 py-1.5">Acompte</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#fdf6cf" }}>
                    <td className="px-2 py-1.5 font-semibold">{money(doc.total_ht, currency)}</td>
                    <td className="px-2 py-1.5">{Number(doc.vat_rate)}%</td>
                    <td className="px-2 py-1.5">{money(doc.total_vat, currency)}</td>
                    <td className="px-2 py-1.5">{money(doc.total_ttc, currency)}</td>
                    <td className="px-2 py-1.5">{money(doc.deposit, currency)}</td>
                  </tr>
                </tbody>
              </table>

              {options.terms && (doc.terms || settings?.terms) && (
                <div className="mt-4 rounded-lg px-4 py-3 text-[11.5px]" style={{ background: "#cfe4e4" }}>
                  <p className="mb-1 font-bold">CONDITIONS COMMERCIALES :</p>
                  {(doc.terms || settings?.terms || "").split("\n").map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                  {settings?.rib && <p>- RIB : {settings.rib}</p>}
                </div>
              )}
            </div>

            <div className="w-[62mm] shrink-0">
              <div className="rounded-lg px-4 py-4 text-center" style={{ background: "#b9d4d4" }}>
                <p className="text-[14px] font-bold">NET A PAYER</p>
                <p className="mt-2 text-[13px]">{money(doc.net_to_pay, currency)}</p>
                <p className="mt-1 text-[12px] capitalize">{amountInWords(doc.net_to_pay, currency)}</p>
              </div>
              {options.stamp && settings?.stamp_url && (
                <img src={settings.stamp_url} alt="Cachet" className="mx-auto mt-3 max-h-[30mm]" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------- PIED DE PAGE ---------- */}
      {options.footer && (
        <div
          className="relative z-10 shrink-0 px-8 py-3 text-center text-[9.5px] leading-relaxed text-white"
          style={{ background: NAVY, fontFamily: "Arial, sans-serif" }}
        >
          <p>
            {settings?.company_name ?? "DODRICOM"}
            {settings?.capital ? ` au capital de ${settings.capital}` : ""}
            {settings?.address ? ` - Siège social : ${settings.address}` : ""}
          </p>
          <p>
            {settings?.phone ? `Tél : ${settings.phone} - ` : ""}
            {settings?.email ? `E-mail : ${settings.email} - ` : ""}
            {settings?.website ? `Web : ${settings.website}` : ""}
          </p>
          <p>
            {settings?.rc ? `R.C : ${settings.rc} - ` : ""}
            {settings?.if_number ? `I.F : ${settings.if_number} - ` : ""}
            {settings?.patente ? `Patente : ${settings.patente} - ` : ""}
            {settings?.ice ? `ICE : ${settings.ice}` : ""}
          </p>
          {count > 1 && (
            <p className="mt-0.5 opacity-80">
              Page {index} / {count}
            </p>
          )}
        </div>
      )}
      {!options.footer && count > 1 && (
        <div className="shrink-0 px-8 pb-3 text-right text-[9.5px] text-black/60">
          Page {index} / {count}
        </div>
      )}
    </div>
  );
}

export type { RowItem };
