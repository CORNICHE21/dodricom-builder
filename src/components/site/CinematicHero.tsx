import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import Lenis from "lenis";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MousePointer2, Award, Briefcase, Headphones, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT, Txt, useCmsImage } from "@/lib/site-text-context";
import { PartnersStrip } from "@/components/site/PartnersStrip";
import exteriorImg from "@/assets/scene-exterior.jpg";
import doorsImg from "@/assets/scene-doors.jpg";
import receptionImg from "@/assets/scene-reception-desk.jpg";

const STATS = [
  { icon: Users, value: "120+", label: "Clients satisfaits" },
  { icon: Briefcase, value: "250+", label: "Projets réalisés" },
  { icon: Award, value: "5+", label: "Années d'expérience" },
  { icon: Headphones, value: "24/7", label: "Support technique" },
];

const TIMELINE = [
  { year: "2019", text: "Création de DODRICOM, premiers projets domotique." },
  { year: "2021", text: "Ouverture des pôles Digital & Réseaux." },
  { year: "2023", text: "Lancement du laboratoire IA." },
  { year: "2025", text: "Un écosystème complet : 6 pôles, 250+ projets." },
];

/**
 * Cinematic scroll-driven camera sequence (Lenis + Framer Motion):
 * Exterior → garden & stairs → glass doors opening → interior hall →
 * reception desk (camera stops) → Presentation section fades in.
 */
export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const t = useT("accueil");
  const imgExterior = useCmsImage("accueil", "scene.exterior", exteriorImg);
  const imgDoors = useCmsImage("accueil", "scene.doors", doorsImg);
  const imgReception = useCmsImage("accueil", "scene.reception", receptionImg);

  // Smooth scroll with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.6,
  });

  // Scene 1 — Exterior: camera walks forward toward the entrance
  const exteriorScale = useTransform(progress, [0, 0.4], [1, 2]);
  const exteriorOpacity = useTransform(progress, [0, 0.3, 0.4], [1, 1, 0]);
  const exteriorFilter = useTransform(
    useTransform(progress, [0.28, 0.4], [0, 6]),
    (b) => `blur(${b}px)`,
  );

  // Scene 2 — Glass doors, opening automatically as we arrive
  const doorsScale = useTransform(progress, [0.34, 0.74], [1.05, 2.6]);
  const doorsOpacity = useTransform(progress, [0.34, 0.44, 0.68, 0.76], [0, 1, 1, 0]);
  const leftDoorX = useTransform(progress, [0.56, 0.72], ["0%", "-62%"]);
  const rightDoorX = useTransform(progress, [0.56, 0.72], ["0%", "62%"]);
  const doorsGap = useTransform(progress, [0.56, 0.72], [0, 1]);

  // Scene 3 — Reception (accueil): camera decelerates and stops
  const receptionScale = useTransform(progress, [0.68, 0.94], [1.35, 1]);
  const receptionOpacity = useTransform(progress, [0.68, 0.78], [0, 1]);
  const receptionVeil = useTransform(progress, [0.88, 1], [0, 0.72]);

  // Hero text overlay fades out early
  const heroOpacity = useTransform(progress, [0, 0.08, 0.16], [1, 1, 0]);
  const heroY = useTransform(progress, [0, 0.16], [0, -60]);

  // Presentation content fades in once the camera has stopped
  const presOpacity = useTransform(progress, [0.9, 0.98], [0, 1]);
  const presY = useTransform(progress, [0.9, 1], [50, 0]);

  const glowOpacity = useTransform(progress, [0, 0.3], [1, 0]);
  const hintOpacity = useTransform(progress, [0, 0.06], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: isMobile ? "420vh" : "700vh" }}>
      {/* Progress rail */}
      <ScrollRail progress={progress} />

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#05060A]">
        {/* Scene 1 — Exterior building */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: exteriorScale, opacity: exteriorOpacity, filter: exteriorFilter }}
        >
          <img
            src={imgExterior}
            alt="Siège DODRICOM la nuit"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          {/* Ambient pulsing glow around logo */}
          <motion.div
            className="pointer-events-none absolute inset-0 animate-pulse-glow"
            style={{ opacity: glowOpacity }}
          >
            <div className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--brand-violet)]/40 blur-3xl" />
          </motion.div>
          {/* Vignette + fog */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-[#05060A]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#05060A_95%)]" />
          <FloatingParticles />
        </motion.div>

        {/* Scene 2 — Doors */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: doorsScale, opacity: doorsOpacity }}
        >
          <img
            src={imgDoors}
            alt="Portes d'entrée en verre du siège DODRICOM"
            width={1920}
            height={1080}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {/* Door split reveal — two halves sliding apart, revealing interior underneath */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 origin-right"
            style={{ x: leftDoorX }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            <motion.div
              className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[color:var(--brand-violet)] to-transparent shadow-[0_0_20px_var(--brand-violet)]"
              style={{ opacity: doorsGap }}
            />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 origin-left"
            style={{ x: rightDoorX }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
            <motion.div
              className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[color:var(--brand-blue)] to-transparent shadow-[0_0_20px_var(--brand-blue)]"
              style={{ opacity: doorsGap }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#05060A_95%)]" />
        </motion.div>

        {/* Partners marquee — visible when the camera reaches the doors */}



        {/* Scene 3 — Accueil / reception desk, final camera position */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: receptionScale, opacity: receptionOpacity }}
        >
          <img
            src={imgReception}
            alt="Comptoir de réception du siège DODRICOM"
            width={1920}
            height={1088}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <motion.div className="absolute inset-0 bg-[#05060A]" style={{ opacity: receptionVeil }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05060A]/50 via-transparent to-[#05060A]/85" />
        </motion.div>

        {/* Hero overlay (initial state) */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
                <Sparkles className="h-4 w-4" />
                <Txt page="accueil" k="hero.eyebrow" />
              </p>
              <h1 className="text-[1.65rem] font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] sm:text-4xl lg:text-[3.5rem]">
                <Txt page="accueil" k="hero.title1" />
                <br />
                <Txt page="accueil" k="hero.title2" />
                <br />
                <span className="gradient-text"><Txt page="accueil" k="hero.title3" /></span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                <Txt page="accueil" k="hero.subtitle" />
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/services"
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  <Txt page="accueil" k="hero.cta1" /> <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="btn-ghost-glow inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                >
                  <Txt page="accueil" k="hero.cta2" />
                </Link>
              </div>

              {/* Bandeau des logos partenaires (géré dans le CMS) */}
              <div className="mt-10 max-w-xl lg:max-w-2xl">
                <PartnersStrip />
              </div>
            </div>
          </div>

        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-white/70"
          style={{ opacity: hintOpacity }}
        >
          <MousePointer2 className="h-4 w-4 animate-bounce" />
          <span className="text-[10px] font-medium uppercase tracking-[0.4em]">
            <Txt page="accueil" k="hero.scrollHint" />
          </span>
        </motion.div>

        {/* Presentation — appears once the camera has stopped at the desk */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto"
          style={{ opacity: presOpacity, y: presY }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-6xl px-5 py-16 text-center lg:px-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
              <Txt page="accueil" k="pres.eyebrow" />
            </p>
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              <Txt page="accueil" k="pres.title1" />
              <br />
              <Txt page="accueil" k="pres.title2" /> <span className="gradient-text"><Txt page="accueil" k="pres.title3" /></span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 lg:text-lg">
              <Txt page="accueil" k="pres.body" />
            </p>

            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="glass px-4 py-5">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-[color:var(--brand-violet)]" />
                  <p className="text-2xl font-black text-white lg:text-3xl">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/55">{label}</p>
                </div>
              ))}
            </div>

            <ol className="mx-auto mt-10 hidden max-w-5xl grid-cols-4 gap-4 lg:grid">
              {TIMELINE.map(({ year, text }) => (
                <li key={year} className="relative border-t border-white/15 pt-4 text-left">
                  <span className="absolute -top-[5px] left-0 h-2.5 w-2.5 rounded-full bg-[var(--gradient-primary)] shadow-[0_0_12px_rgba(139,61,255,0.9)]" />
                  <p className="text-sm font-black gradient-text">{year}</p>
                  <p className="mt-1 text-xs text-white/70">{text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/a-propos"
                className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                Notre histoire <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="btn-ghost-glow inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Explorer nos services
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ScrollRail({ progress }: { progress: MotionValue<number> }) {
  const height = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <div className="pointer-events-none fixed right-4 top-1/2 z-40 hidden h-40 w-[2px] -translate-y-1/2 rounded-full bg-white/10 lg:block">
      <motion.div
        className="w-full rounded-full bg-[var(--gradient-primary)] shadow-[0_0_10px_rgba(139,61,255,0.8)]"
        style={{ height }}
      />
    </div>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 37) % 100;
        const delay = (i % 6) * 0.4;
        const size = 2 + (i % 3);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-white/40 blur-[1px]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              animation: `float 6s ease-in-out ${delay}s infinite`,
              boxShadow: "0 0 8px rgba(180,124,255,0.6)",
            }}
          />
        );
      })}
    </div>
  );
}