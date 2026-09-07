import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export const PAGE_ORDER = [
  "/",
  "/a-propos",
  "/services",
  "/realisations",
  "/blog",
  "/contact",
] as const;

/**
 * Navigue vers la page suivante / précédente quand l'utilisateur
 * continue de scroller au-delà du bas (ou du haut) de la page.
 */
export function useScrollPageNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lockedRef = useRef(false);
  const intentRef = useRef(0);

  useEffect(() => {
    lockedRef.current = false;
    intentRef.current = 0;
  }, [pathname]);

  useEffect(() => {
    const index = PAGE_ORDER.indexOf(pathname as (typeof PAGE_ORDER)[number]);
    if (index === -1) return;

    const THRESHOLD = 220;

    const go = (dir: 1 | -1) => {
      const target = PAGE_ORDER[index + dir];
      if (!target || lockedRef.current) return;
      lockedRef.current = true;
      intentRef.current = 0;
      navigate({ to: target });
      window.setTimeout(() => {
        window.scrollTo({ top: dir === 1 ? 0 : 0, behavior: "auto" });
      }, 0);
    };

    const onWheel = (e: WheelEvent) => {
      if (lockedRef.current) return;
      const doc = document.documentElement;
      const atBottom =
        window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
      const atTop = window.scrollY <= 2;

      if (e.deltaY > 0 && atBottom) {
        intentRef.current = Math.max(0, intentRef.current) + e.deltaY;
        if (intentRef.current > THRESHOLD) go(1);
      } else if (e.deltaY < 0 && atTop) {
        intentRef.current = Math.min(0, intentRef.current) + e.deltaY;
        if (intentRef.current < -THRESHOLD) go(-1);
      } else {
        intentRef.current = 0;
      }
    };

    let touchStart = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (lockedRef.current) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = touchStart - y;
      const doc = document.documentElement;
      const atBottom =
        window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
      const atTop = window.scrollY <= 2;
      if (delta > 90 && atBottom) go(1);
      else if (delta < -90 && atTop) go(-1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [pathname, navigate]);
}