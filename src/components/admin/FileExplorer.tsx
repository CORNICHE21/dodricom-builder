import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronRight,
  File as FileIcon,
  FilePlus2,
  FolderPlus,
  Folder,
  Image as ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createProjectEntry,
  deleteProjectEntry,
  listProjectFiles,
  readProjectFile,
  renameProjectEntry,
  writeProjectFile,
} from "@/lib/project-files.functions";
import { isImagePath, type FsEntry } from "@/lib/project-files";

const btn =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:text-white hover:border-[color:var(--brand-violet)]/50";

export function FileExplorer() {
  const list = useServerFn(listProjectFiles);
  const read = useServerFn(readProjectFile);
  const write = useServerFn(writeProjectFile);
  const create = useServerFn(createProjectEntry);
  const remove = useServerFn(deleteProjectEntry);
  const rename = useServerFn(renameProjectEntry);

  const [dir, setDir] = useState("src");
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(
    async (target = dir) => {
      setLoading(true);
      setError(null);
      try {
        setEntries(await list({ data: { dir: target } }));
      } catch (e) {
        setError((e as Error).message);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [dir, list],
  );

  useEffect(() => {
    void refresh(dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir]);

  const openFile = async (p: string) => {
    setError(null);
    try {
      const res = await read({ data: { path: p } });
      setOpenPath(p);
      setDirty(false);
      if (res.binary) {
        setPreview(res.dataUrl);
        setContent("");
      } else {
        setPreview(null);
        setContent(res.content);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const save = async () => {
    if (!openPath) return;
    setSaving(true);
    setError(null);
    try {
      await write({ data: { path: openPath, content } });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const addFile = () => {
    const name = window.prompt("Nom du nouveau fichier (ex : MonComposant.tsx)");
    if (!name) return;
    void act(() => create({ data: { path: `${dir ? dir + "/" : ""}${name}`, kind: "file" } }));
  };

  const addFolder = () => {
    const name = window.prompt("Nom du nouveau dossier");
    if (!name) return;
    void act(() => create({ data: { path: `${dir ? dir + "/" : ""}${name}`, kind: "dir" } }));
  };

  const renameEntry = (e: FsEntry) => {
    const name = window.prompt("Nouveau nom", e.name);
    if (!name || name === e.name) return;
    const parent = e.path.split("/").slice(0, -1).join("/");
    void act(() => rename({ data: { from: e.path, to: `${parent ? parent + "/" : ""}${name}` } }));
  };

  const deleteEntry = (e: FsEntry) => {
    if (!window.confirm(`Supprimer définitivement « ${e.name} » ?`)) return;
    if (openPath === e.path) {
      setOpenPath(null);
      setPreview(null);
      setContent("");
    }
    void act(() => remove({ data: { path: e.path } }));
  };

  const onUpload = async (file: File) => {
    const buf = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (const b of buf) bin += String.fromCharCode(b);
    const base64 = btoa(bin);
    await act(() =>
      create({ data: { path: `${dir ? dir + "/" : ""}${file.name}`, kind: "file", base64 } }),
    );
  };

  const parts = dir ? dir.split("/") : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => void refresh()} className={btn}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </button>
        <button onClick={addFile} className={btn}>
          <FilePlus2 className="h-3.5 w-3.5" /> Nouveau fichier
        </button>
        <button onClick={addFolder} className={btn}>
          <FolderPlus className="h-3.5 w-3.5" /> Nouveau dossier
        </button>
        <button onClick={() => uploadRef.current?.click()} className={btn}>
          <Upload className="h-3.5 w-3.5" /> Téléverser
        </button>
        <input
          ref={uploadRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 text-xs text-white/50">
        <button onClick={() => setDir("")} className="hover:text-white">
          racine
        </button>
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => setDir(parts.slice(0, i + 1).join("/"))} className="hover:text-white">
              {p}
            </button>
          </span>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          {dir && (
            <button
              onClick={() => setDir(dir.split("/").slice(0, -1).join("/"))}
              className="w-full rounded-xl px-3 py-2 text-left text-xs text-white/50 hover:bg-white/[0.05] hover:text-white"
            >
              ../
            </button>
          )}
          {loading && !entries.length ? (
            <p className="px-3 py-2 text-xs text-white/40">Chargement…</p>
          ) : (
            entries.map((e) => (
              <div
                key={e.path}
                className={`group flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition ${
                  openPath === e.path ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <button
                  onClick={() => (e.type === "dir" ? setDir(e.path) : void openFile(e.path))}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {e.type === "dir" ? (
                    <Folder className="h-4 w-4 shrink-0 text-[color:var(--brand-violet)]" />
                  ) : isImagePath(e.path) ? (
                    <ImageIcon className="h-4 w-4 shrink-0 text-[color:var(--brand-cyan)]" />
                  ) : (
                    <FileIcon className="h-4 w-4 shrink-0 text-white/40" />
                  )}
                  <span className="truncate">{e.name}</span>
                </button>
                <button
                  onClick={() => renameEntry(e)}
                  title="Renommer"
                  className="p-1 text-white/30 opacity-0 transition hover:text-white group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteEntry(e)}
                  title="Supprimer"
                  className="p-1 text-white/30 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          {!loading && !entries.length && !error && (
            <p className="px-3 py-2 text-xs text-white/40">Dossier vide.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          {!openPath ? (
            <p className="p-6 text-sm text-white/40">
              Sélectionnez un fichier pour l'éditer, ou une image pour la prévisualiser.
            </p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="truncate font-mono text-xs text-white/60">{openPath}</p>
                {preview === null && (
                  <button
                    onClick={() => void save()}
                    disabled={saving || !dirty}
                    className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saved ? "Enregistré" : "Enregistrer"}
                  </button>
                )}
              </div>
              {preview ? (
                <div className="grid place-items-center rounded-xl border border-white/10 bg-white/[0.02] p-6">
                  <img src={preview} alt={openPath} className="max-h-[420px] rounded-lg" />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setDirty(true);
                  }}
                  spellCheck={false}
                  className="h-[460px] w-full resize-none rounded-xl border border-white/10 bg-[#05060A] p-4 font-mono text-[12.5px] leading-relaxed text-white/85 outline-none focus:border-[color:var(--brand-violet)]/60"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
