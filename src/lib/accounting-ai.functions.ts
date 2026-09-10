/**
 * Assistant IA comptable : propose les lignes d'une écriture (débit/crédit)
 * à partir de la description d'un mouvement et du plan comptable existant.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "@/lib/gemini.server";

export type AiEntryLine = {
  account_code: string;
  label: string;
  debit: number;
  credit: number;
};

export type AiEntrySuggestion = {
  journal_code: string | null;
  label: string | null;
  lines: AiEntryLine[];
  note: string | null;
};

const schema = z.object({
  description: z.string().min(3),
  amount: z.number().optional(),
  journalCodes: z.array(z.string()).default([]),
  accounts: z
    .array(z.object({ code: z.string(), label: z.string() }))
    .default([]),
  currentLines: z
    .array(
      z.object({
        account_code: z.string(),
        label: z.string(),
        debit: z.number(),
        credit: z.number(),
      }),
    )
    .default([]),
});

const SYSTEM = `Tu es un expert-comptable marocain (plan comptable CGNC).
Tu proposes l'écriture comptable équilibrée correspondant au mouvement décrit.
Règles :
- La somme des débits DOIT être exactement égale à la somme des crédits.
- Utilise en priorité les comptes fournis dans la liste du plan comptable.
- Codes usuels : 3421 clients, 4411 fournisseurs, 7121 ventes, 4455 TVA facturée,
  3455 TVA récupérable, 5141 banque, 5161 caisse, 6171 salaires, 6121 achats,
  6188 charges diverses.
- Réponds UNIQUEMENT en JSON valide, sans texte autour, au format :
  {"journal_code":"VEN","label":"...","lines":[{"account_code":"3421","label":"...","debit":1200,"credit":0}],"note":"explication courte en français"}`;

export const suggestEntryLines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }): Promise<AiEntrySuggestion> => {
    const prompt = [
      `Mouvement à comptabiliser : ${data.description}`,
      data.amount ? `Montant total : ${data.amount}` : "",
      data.journalCodes.length ? `Journaux disponibles : ${data.journalCodes.join(", ")}` : "",
      data.accounts.length
        ? `Plan comptable :\n${data.accounts
            .slice(0, 200)
            .map((a) => `${a.code} — ${a.label}`)
            .join("\n")}`
        : "",
      data.currentLines.length
        ? `Lignes déjà saisies (à corriger si besoin) :\n${data.currentLines
            .map((l) => `${l.account_code} D${l.debit} C${l.credit} ${l.label}`)
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const raw = await generateText({
      system: SYSTEM,
      parts: [{ text: prompt }],
      json: true,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "").trim());
    } catch {
      throw new Error("L'IA n'a pas renvoyé une écriture exploitable.");
    }

    const out = z
      .object({
        journal_code: z.string().nullish(),
        label: z.string().nullish(),
        note: z.string().nullish(),
        lines: z
          .array(
            z.object({
              account_code: z.string(),
              label: z.string().nullish(),
              debit: z.coerce.number().default(0),
              credit: z.coerce.number().default(0),
            }),
          )
          .default([]),
      })
      .parse(parsed);

    return {
      journal_code: out.journal_code ?? null,
      label: out.label ?? null,
      note: out.note ?? null,
      lines: out.lines.map((l) => ({
        account_code: l.account_code,
        label: l.label ?? "",
        debit: Math.round(l.debit * 100) / 100,
        credit: Math.round(l.credit * 100) / 100,
      })),
    };
  });
