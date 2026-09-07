import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertFsAdmin,
  BLOCKED_ENTRIES,
  isTextPath,
  mimeOf,
  safeRelative,
  type AdminRpcCtx,
  type FsEntry,
} from "@/lib/project-files";

/** Racine des sources du projet (et non la version compilée servie en production). */
async function sourceRoot(): Promise<string> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const seen: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    seen.push(dir);
    try {
      const items = await fs.readdir(dir);
      if (items.includes("package.json") && items.includes("src")) {
        const sub = await fs.readdir(path.join(dir, "src"));
        if (sub.includes("routes") || sub.includes("components")) return dir;
      }
    } catch {
      /* ignore */
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "Les fichiers sources du projet ne sont pas accessibles depuis cet environnement (seule la version compilée est déployée). Ouvrez l'explorateur depuis l'aperçu de développement.",
  );
}

export const listProjectFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dir?: string }) => d)
  .handler(async ({ data, context }): Promise<FsEntry[]> => {
    await assertFsAdmin(context as unknown as AdminRpcCtx);
    const rel = safeRelative(data.dir ?? "");
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = await sourceRoot();
    const abs = (p: string) => path.join(root, p);
    const items = await fs.readdir(abs(rel), { withFileTypes: true });
    const out: FsEntry[] = [];
    for (const it of items) {
      if (BLOCKED_ENTRIES.includes(it.name)) continue;
      const p = rel ? `${rel}/${it.name}` : it.name;
      let size = 0;
      if (it.isFile()) {
        try {
          size = (await fs.stat(abs(p))).size;
        } catch {
          size = 0;
        }
      }
      out.push({ name: it.name, path: p, type: it.isDirectory() ? "dir" : "file", size });
    }
    return out.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1,
    );
  });

export const readProjectFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) => d)
  .handler(
    async ({ data, context }): Promise<{ path: string; content: string; binary: boolean; dataUrl: string | null }> => {
      await assertFsAdmin(context as unknown as AdminRpcCtx);
      const rel = safeRelative(data.path);
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const abs = path.join(await sourceRoot(), rel);
      if (isTextPath(rel)) {
        return { path: rel, content: await fs.readFile(abs, "utf8"), binary: false, dataUrl: null };
      }
      const buf = await fs.readFile(abs);
      return {
        path: rel,
        content: "",
        binary: true,
        dataUrl: `data:${mimeOf(rel)};base64,${Buffer.from(buf).toString("base64")}`,
      };
    },
  );

export const writeProjectFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string; content: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertFsAdmin(context as unknown as AdminRpcCtx);
    const rel = safeRelative(data.path);
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    await fs.writeFile(path.join(await sourceRoot(), rel), data.content, "utf8");
    return { ok: true };
  });

export const createProjectEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string; kind: "file" | "dir"; base64?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertFsAdmin(context as unknown as AdminRpcCtx);
    const rel = safeRelative(data.path);
    if (!rel) throw new Error("Chemin invalide.");
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const abs = path.join(await sourceRoot(), rel);
    if (data.kind === "dir") {
      await fs.mkdir(abs, { recursive: true });
      return { ok: true };
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    if (data.base64) await fs.writeFile(abs, Buffer.from(data.base64, "base64"));
    else await fs.writeFile(abs, "", "utf8");
    return { ok: true };
  });

export const deleteProjectEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertFsAdmin(context as unknown as AdminRpcCtx);
    const rel = safeRelative(data.path);
    if (!rel) throw new Error("Chemin invalide.");
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    await fs.rm(path.join(await sourceRoot(), rel), { recursive: true, force: true });
    return { ok: true };
  });

export const renameProjectEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertFsAdmin(context as unknown as AdminRpcCtx);
    const from = safeRelative(data.from);
    const to = safeRelative(data.to);
    if (!from || !to) throw new Error("Chemin invalide.");
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = await sourceRoot();
    const absTo = path.join(root, to);
    await fs.mkdir(path.dirname(absTo), { recursive: true });
    await fs.rename(path.join(root, from), absTo);
    return { ok: true };
  });
