import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MaintenanceScreen } from "./MaintenanceScreen";
import { useScrollPageNav, PAGE_ORDER } from "@/lib/use-scroll-page-nav";
import { CustomTexts, useSiteConfig } from "@/lib/site-text-context";
import { useAuth } from "@/lib/auth";

export function slugFromPath(pathname: string) {
  return pathname === "/" ? "accueil" : pathname.replace(/^\//, "").replace(/\/$/, "");
}

export function SiteLayout({ children }: { children: ReactNode }) {
  useScrollPageNav();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const index = PAGE_ORDER.indexOf(pathname as (typeof PAGE_ORDER)[number]);
  const next = index >= 0 ? PAGE_ORDER[index + 1] : undefined;
  const { maintenance, pageVisibility } = useSiteConfig();
  const { user } = useAuth();
  const slug = slugFromPath(pathname);
  const pageHidden = pageVisibility[slug] === false;

  const canBypassMaintenance =
    !!user && (user.roles.includes("super_admin") || user.maintenanceAccess);

  if (maintenance.enabled && !canBypassMaintenance) return <MaintenanceScreen />;


  return (
    <div className="relative min-h-screen">
      <Navbar />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pt-[78px] lg:pt-[90px]"
      >
        {pageHidden && !user ? (
          <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
            <h1 className="text-3xl font-black text-white">Page indisponible</h1>
            <p className="mt-3 text-white/60">Cette page n'est pas accessible pour le moment.</p>
            <Link to="/" className="btn-gradient mt-6 rounded-full px-5 py-2.5 text-sm font-semibold">
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <>
            {pageHidden && user && (
              <p className="mx-auto mb-2 w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs text-amber-200">
                Page masquée aux visiteurs (visible car vous êtes connecté).
              </p>
            )}
            {children}
            <CustomTexts page={slug} />
          </>
        )}
      </motion.main>
      {next && (
        <div className="pointer-events-none flex justify-center pb-6">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 backdrop-blur-xl">
            Continuez à défiler pour la page suivante
          </span>
        </div>
      )}
      <Footer />
    </div>
  );
}


export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  bgImage,
  bgAlt,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  bgImage?: string;
  bgAlt?: string;
}) {
  return (
    <section className="relative overflow-hidden">
      {bgImage ? (
        <>
          <img
            src={bgImage}
            alt={bgAlt ?? ""}
            aria-hidden={bgAlt ? undefined : true}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/85 to-[#05060A]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:var(--gradient-radial)]" />
      )}
      <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        {eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}