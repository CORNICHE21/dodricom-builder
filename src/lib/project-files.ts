export type FsEntry = {
  name: string;
  path: string;
  type: "dir" | "file";
  size: number;
};

export type AdminRpcCtx = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
};

export async function assertFsAdmin(context: AdminRpcCtx) {
  const [admin, superAdmin] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  if (!admin.data && !superAdmin.data) throw new Error("Accès refusé : réservé aux administrateurs.");
}

export const BLOCKED_ENTRIES = [
  ".git",
  "node_modules",
  ".env",
  ".env.local",
  "dist",
  "build",
  ".output",
  ".vinxi",
  ".tanstack",
  ".nitro",
  ".wrangler",
  ".cache",
  ".turbo",
  "bun.lockb",
  "bun.lock",
  "package-lock.json",
  "routeTree.gen.ts",
];


export function safeRelative(input: string) {
  const rel = (input || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (rel.split("/").some((p) => p === "..")) throw new Error("Chemin invalide.");
  const first = rel.split("/")[0] ?? "";
  if (BLOCKED_ENTRIES.includes(first)) throw new Error("Ce dossier est protégé.");
  return rel;
}

const TEXT_EXT = new Set([
  "ts", "tsx", "js", "jsx", "json", "css", "scss", "html", "md", "mdx", "txt", "svg",
  "yml", "yaml", "toml", "sql", "env", "gitignore", "prettierrc", "sh", "cjs", "mjs",
]);

export function isTextPath(p: string) {
  const base = p.split("/").pop() ?? p;
  if (!base.includes(".")) return true;
  const ext = base.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXT.has(ext);
}

export function isImagePath(p: string) {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "jpg", "jpeg", "gif", "webp", "avif", "ico"].includes(ext);
}

export function mimeOf(p: string) {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "ico":
      return "image/x-icon";
    default:
      return "image/jpeg";
  }
}
