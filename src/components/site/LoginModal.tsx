import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, Shield, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await loginWithPassword(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose();
    navigate({ to: "/admin" });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-full max-w-md"
          >
            {/* Neon border glow */}
            <div
              aria-hidden
              className="absolute -inset-[1.5px] rounded-3xl opacity-90 blur-[2px]"
              style={{ background: "var(--gradient-brand)" }}
            />
            <div className="glass-strong relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ background: "var(--gradient-primary)" }}
              />
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative mb-6 flex flex-col items-center text-center">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.55)]">
                  <Shield className="h-6 w-6 text-white" />
                </span>
                <h2 id="login-title" className="text-2xl font-bold text-white">
                  Secure Back Office Access
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Accès réservé à l'administration DODRICOM.
                </p>
              </div>

              <form onSubmit={submit} className="relative space-y-4">
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                >
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    placeholder="admin@dodricom.com"
                  />
                </Field>

                <Field
                  icon={<Lock className="h-4 w-4" />}
                  label="Mot de passe"
                  right={
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="text-white/50 hover:text-white"
                      aria-label={show ? "Masquer" : "Afficher"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                >
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    placeholder="••••••"
                  />
                </Field>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-white/70">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[color:var(--brand-violet)]"
                    />
                    Se souvenir de moi
                  </label>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Connexion…
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost-glow inline-flex flex-1 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon,
  label,
  right,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-[color:var(--brand-violet)]/60 focus-within:shadow-[0_0_0_3px_rgba(139,61,255,0.2)]">
        <span className="text-white/50">{icon}</span>
        {children}
        {right}
      </span>
    </label>
  );
}