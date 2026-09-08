// Server-only Google Gemini client. Never imported by browser code.

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export const GEMINI_MODEL = "gemini-3.6-flash";
/** Used automatically when the main model is temporarily overloaded. */
export const GEMINI_FALLBACK_MODEL = "gemini-flash-latest";

/** Convert a data URL (data:image/png;base64,xxx) into a Gemini inlineData part. */
export function dataUrlToPart(dataUrl: string): GeminiPart {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Image invalide (format attendu : data URL base64).");
  return { inlineData: { mimeType: match[1]!, data: match[2]! } };
}

function getApiKey(): string {
  const key = process.env["GEMINI_API_KEY"];
  if (!key || !key.trim()) {
    throw new Error(
      "IA indisponible : la variable d'environnement GEMINI_API_KEY est absente sur le serveur.",
    );
  }
  return key.trim();
}

/**
 * Calls Gemini generateContent and returns the raw text of the first candidate.
 * `json: true` asks Gemini for a strict JSON response.
 */
export async function generateText(opts: {
  system: string;
  parts: GeminiPart[];
  json?: boolean;
  model?: string;
}): Promise<string> {
  const apiKey = getApiKey();
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: opts.parts }],
    generationConfig: {
      temperature: 0.4,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  const call = async (model: string) => {
    try {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body,
        },
      );
    } catch (e) {
      throw new Error(
        `Impossible de joindre l'API Gemini : ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const primary = opts.model ?? GEMINI_MODEL;
  let res = await call(primary);
  // The Flash model is occasionally saturated: fall back once to the rolling Flash alias.
  if (res.status === 503 && primary !== GEMINI_FALLBACK_MODEL) {
    res = await call(GEMINI_FALLBACK_MODEL);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    if (res.status === 400 && /API key not valid/i.test(detail))
      throw new Error("Clé GEMINI_API_KEY invalide : vérifiez la valeur configurée sur le serveur.");
    if (res.status === 401 || res.status === 403)
      throw new Error("Accès refusé par Gemini : clé GEMINI_API_KEY invalide ou sans droits sur ce modèle.");
    if (res.status === 404)
      throw new Error(`Modèle Gemini indisponible (${primary}). Mettez à jour le nom du modèle.`);
    if (res.status === 429)
      throw new Error("Quota Gemini atteint, réessayez dans un instant.");
    if (res.status >= 500)
      throw new Error(`Service Gemini surchargé (${res.status}), réessayez dans un instant.`);
    throw new Error(`Erreur Gemini (${res.status}) : ${detail}`);
  }


  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (payload.promptFeedback?.blockReason)
    throw new Error(`Requête bloquée par Gemini (${payload.promptFeedback.blockReason}).`);

  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Réponse vide de l'IA.");
  return text;
}
