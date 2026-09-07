import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Users, FileText, ShoppingCart, KanbanSquare, LifeBuoy, Building2 } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useT, Txt, useCmsImage } from "@/lib/site-text-context";
import heroSaas from "@/assets/hero-saas.jpg";

export const Route = createFileRoute("/saas")({
  component: SaasPage,
  head: () => ({
    meta: [
      { title: "Solutions SaaS — DODRICOM" },
      { name: "description", content: "Découvrez nos solutions SaaS : CRM, RH, Facturation, E-commerce, Gestion de projet et Helpdesk." },
    ],
  }),
});

const APPS = [
  { icon: Users, name: "CRM", desc: "Gérez vos clients, opportunités et pipeline de vente.", price: "199 DH /mois" },
  { icon: Building2, name: "RH", desc: "Suivi des collaborateurs, congés et paie centralisée.", price: "249 DH /mois" },
  { icon: FileText, name: "Facturation", desc: "Devis, factures et relances automatiques.", price: "149 DH /mois" },
  { icon: ShoppingCart, name: "E-commerce", desc: "Boutique en ligne clé en main avec paiement intégré.", price: "299 DH /mois" },
  { icon: KanbanSquare, name: "Gestion de projet", desc: "Tâches, jalons et collaboration temps réel.", price: "179 DH /mois" },
  { icon: LifeBuoy, name: "Helpdesk", desc: "Tickets, SLA et base de connaissances client.", price: "199 DH /mois" },
];

const PLANS = [
  { name: "Starter", price: "299 DH", period: "/mois", features: ["1 application au choix", "3 utilisateurs", "Support email", "Sauvegardes quotidiennes"] },
  { name: "Business", price: "699 DH", period: "/mois", popular: true, features: ["3 applications au choix", "15 utilisateurs", "Support prioritaire", "API & intégrations"] },
  { name: "Enterprise", price: "1 499 DH", period: "/mois", features: ["Toutes les applications", "Utilisateurs illimités", "SLA dédié 24/7", "Accompagnement expert"] },
];

function SaasPage() {
  const t = useT("saas");
  const headerBg = useCmsImage("saas", "header.bg", heroSaas);
  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("hero.eyebrow")}
        title={<><Txt page="saas" k="hero.title1" /> <span className="gradient-text"><Txt page="saas" k="hero.title2" /></span>.</>}
        subtitle={t("hero.subtitle")}
        bgImage={headerBg}
        bgAlt="Espace de travail cloud SaaS DODRICOM"
      />

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map(({ icon: Icon, name, desc, price }) => (
            <div key={name} className="glass card-hover p-7">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--gradient-primary)] shadow-[0_0_20px_rgba(139,61,255,0.4)]">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{name}</h3>
              <p className="mt-2 text-sm text-white/70">{desc}</p>
              <p className="mt-5 text-lg font-black gradient-text">{price}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] gradient-text"><Txt page="saas" k="plans.title" /></p>
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`glass p-8 ${p.popular ? "border-[color:var(--brand-violet)]/60 shadow-[0_0_40px_rgba(139,61,255,0.35)]" : ""}`}>
              {p.popular && (
                <span className="mb-3 inline-block rounded-full bg-[var(--gradient-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Txt page="saas" k="plans.popular" />
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black gradient-text">{p.price}</span>
                <span className="text-sm text-white/60">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-white/80">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-violet)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="btn-gradient mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
                <Txt page="saas" k="plans.cta" /> <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}