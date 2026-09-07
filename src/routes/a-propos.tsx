import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Briefcase,
  ChevronDown,
  Handshake,
  Headphones,
  Lightbulb,
  Shield,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useT, Txt } from "@/lib/site-text-context";
import aboutReception from "@/assets/about-reception.jpg";

export const Route = createFileRoute("/a-propos")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "À propos — DODRICOM" },
      { name: "description", content: "Découvrez DODRICOM : mission, vision, valeurs et chiffres clés." },
    ],
  }),
});

const VALUE_ICONS = [Lightbulb, ShieldCheck, Handshake, BarChart3];
const STAT_ICONS = [Users, Briefcase, Award, Headphones];

function AboutPage() {
  const t = useT("a-propos");
  const VALUES = VALUE_ICONS.map((icon, i) => ({
    icon,
    title: t(`values.${i + 1}.title`),
    desc: t(`values.${i + 1}.desc`),
  }));
  const STATS = STAT_ICONS.map((icon, i) => ({
    icon,
    value: t(`stats.${i + 1}.value`),
    label: t(`stats.${i + 1}.label`),
  }));
  return (
    <SiteLayout>
      {/* HERO — reception background with intro + bullets */}
      <section className="relative -mt-[78px] min-h-screen overflow-hidden lg:-mt-[90px]">
        <img
          src={aboutReception}
          alt="Réception du siège DODRICOM"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/85 to-[#05060A]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-[#05060A]/40" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pb-48 pt-32 lg:px-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
            <Txt page="a-propos" k="hero.eyebrow" />
          </p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <Txt page="a-propos" k="hero.title1" />
            <br />
            <span className="gradient-text"><Txt page="a-propos" k="hero.title2" /></span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 lg:text-lg">
            <Txt page="a-propos" k="hero.subtitle" />
          </p>
          <ul className="mt-8 grid max-w-xl gap-4">
            {[
              { icon: Target, text: t("bullet1") },
              { icon: Shield, text: t("bullet2") },
              { icon: Users, text: t("bullet3") },
              { icon: Headphones, text: t("bullet4") },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color:var(--brand-violet)]/40 bg-[color:var(--brand-violet)]/10">
                  <Icon className="h-4 w-4 text-[color:var(--brand-violet)]" />
                </span>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>

          {/* Bottom trio */}
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            <div className="glass p-6">
              <h3 className="text-lg font-bold gradient-text"><Txt page="a-propos" k="mission.title" /></h3>
              <p className="mt-2 text-sm text-white/75">
                <Txt page="a-propos" k="mission.body" />
              </p>
              <div className="my-4 h-px bg-white/10" />
              <h3 className="text-lg font-bold gradient-text"><Txt page="a-propos" k="vision.title" /></h3>
              <p className="mt-2 text-sm text-white/75">
                <Txt page="a-propos" k="vision.body" />
              </p>
            </div>

            <div className="glass p-6">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] gradient-text">
                <Txt page="a-propos" k="stats.title" />
              </p>
              <div className="grid grid-cols-2 gap-5">
                {STATS.map(({ icon: Icon, value, label }) => (
                  <div key={label}>
                    <Icon className="mb-2 h-5 w-5 text-[color:var(--brand-violet)]" />
                    <div className="text-2xl font-black text-white">{value}</div>
                    <div className="text-[11px] text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] gradient-text">
                <Txt page="a-propos" k="values.title" />
              </p>
              <ul className="space-y-4">
                {VALUES.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-violet)]" />
                    <div>
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="text-xs text-white/60">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-white/60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em]">Scroller</p>
          <ChevronDown className="mx-auto mt-2 h-5 w-5 animate-bounce" />
        </div>
      </section>
    </SiteLayout>
  );
}