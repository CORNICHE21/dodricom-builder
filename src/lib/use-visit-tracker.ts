import { useEffect } from "react";
import { trackVisit } from "@/lib/analytics.functions";

const KEY = "dodricom.visit.session";

function sessionId() {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Enregistre une visite à chaque changement de page du site public. */
export function useVisitTracker(path: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path.startsWith("/admin")) return;
    const id = sessionId();
    if (!id) return;
    const timer = window.setTimeout(() => {
      void trackVisit({
        data: { sessionId: id, path, referrer: document.referrer || "" },
      }).catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [path]);
}
