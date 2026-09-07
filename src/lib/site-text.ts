export type TextField = {
  key: string;
  label: string;
  def: string;
  multiline?: boolean;
};

export type TextPage = {
  slug: string;
  name: string;
  route: string;
  fields: TextField[];
};

export const TEXT_PAGES: TextPage[] = [
  {
    slug: "accueil",
    name: "Accueil",
    route: "/",
    fields: [
      { key: "hero.eyebrow", label: "Hero — sur-titre", def: "Bienvenue chez DODRICOM" },
      { key: "hero.title1", label: "Hero — titre ligne 1", def: "L'innovation" },
      { key: "hero.title2", label: "Hero — titre ligne 2", def: "qui transforme" },
      { key: "hero.title3", label: "Hero — titre ligne 3 (dégradé)", def: "votre entreprise" },
      {
        key: "hero.subtitle",
        label: "Hero — description",
        def: "Franchissez les portes de DODRICOM. Domotique, Digital, Réseaux, IA, COM et Événementiel — un écosystème premium au service de votre performance.",
        multiline: true,
      },
      { key: "hero.cta1", label: "Hero — bouton principal", def: "Découvrir" },
      { key: "hero.cta2", label: "Hero — bouton secondaire", def: "Nous contacter" },
      { key: "hero.scrollHint", label: "Hero — indice de scroll", def: "Scroll pour entrer" },
      { key: "pres.eyebrow", label: "Présentation — sur-titre", def: "Qui sommes-nous" },
      { key: "pres.title1", label: "Présentation — titre ligne 1", def: "Un écosystème d'expertises," },
      { key: "pres.title2", label: "Présentation — titre ligne 2", def: "une seule" },
      { key: "pres.title3", label: "Présentation — mot en dégradé", def: "signature" },
      {
        key: "pres.body",
        label: "Présentation — texte",
        def: "Vous êtes à l'intérieur. Ici, chaque discipline — de la domotique à l'IA — travaille comme une équipe. Notre mission : transformer vos ambitions en systèmes qui performent.",
        multiline: true,
      },
      { key: "services.eyebrow", label: "Section services — sur-titre", def: "Nos services" },
      {
        key: "services.title",
        label: "Section services — titre",
        def: "Un écosystème complet pour accélérer votre entreprise.",
        multiline: true,
      },
      { key: "services.cta", label: "Section services — bouton", def: "Voir tous les services" },
      { key: "about.eyebrow", label: "Section à propos — sur-titre", def: "À propos de DODRICOM" },
      {
        key: "about.title",
        label: "Section à propos — titre",
        def: "Une équipe passionnée. Des solutions sur mesure.",
        multiline: true,
      },
      {
        key: "about.body",
        label: "Section à propos — texte",
        def: "DODRICOM est une entreprise innovante spécialisée dans la Domotique, le Digital, les Réseaux, l'IA, la COM et l'Événementiel. Nous accompagnons nos clients de A à Z avec des solutions robustes et évolutives.",
        multiline: true,
      },
      { key: "about.bullet1", label: "À propos — point 1", def: "Des solutions sur mesure adaptées à vos besoins" },
      { key: "about.bullet2", label: "À propos — point 2", def: "Une approche centrée sur la qualité et la performance" },
      { key: "about.bullet3", label: "À propos — point 3", def: "Un accompagnement de A à Z" },
      { key: "about.bullet4", label: "À propos — point 4", def: "Une équipe d'experts passionnés à votre service" },
      { key: "about.cta", label: "À propos — bouton", def: "En savoir plus" },
      { key: "cta.title", label: "Bandeau final — titre", def: "Prêt à passer à la vitesse supérieure ?" },
      {
        key: "cta.body",
        label: "Bandeau final — texte",
        def: "Discutons de votre projet. Nous vous répondons sous 24 h avec un devis clair et détaillé.",
        multiline: true,
      },
      { key: "cta.button", label: "Bandeau final — bouton", def: "Demander un devis" },
    ],
  },
  {
    slug: "a-propos",
    name: "À propos",
    route: "/a-propos",
    fields: [
      { key: "hero.eyebrow", label: "Sur-titre", def: "À propos de DODRICOM" },
      { key: "hero.title1", label: "Titre ligne 1", def: "Présentation" },
      { key: "hero.title2", label: "Titre ligne 2 (dégradé)", def: "Commerciale" },
      {
        key: "hero.subtitle",
        label: "Introduction",
        def: "DODRICOM est une entreprise innovante spécialisée dans la Domotique, le Digital, les Réseaux, l'IA, la COM et l'Événementiel.",
        multiline: true,
      },
      { key: "bullet1", label: "Point 1", def: "Des solutions sur mesure adaptées à vos besoins" },
      { key: "bullet2", label: "Point 2", def: "Une approche centrée sur la qualité et la performance" },
      { key: "bullet3", label: "Point 3", def: "Un accompagnement de A à Z" },
      { key: "bullet4", label: "Point 4", def: "Une équipe d'experts passionnés à votre service" },
      { key: "mission.title", label: "Mission — titre", def: "Notre mission" },
      {
        key: "mission.body",
        label: "Mission — texte",
        def: "Accompagner nos clients avec des solutions intelligentes, fiables et évolutives pour relever les défis d'aujourd'hui et de demain.",
        multiline: true,
      },
      { key: "vision.title", label: "Vision — titre", def: "Notre vision" },
      {
        key: "vision.body",
        label: "Vision — texte",
        def: "Devenir un acteur de référence grâce à l'innovation, la confiance et l'excellence opérationnelle.",
        multiline: true,
      },
      { key: "stats.title", label: "Chiffres — titre", def: "DODRICOM en chiffres" },
      { key: "stats.1.value", label: "Chiffre 1 — valeur", def: "120+" },
      { key: "stats.1.label", label: "Chiffre 1 — libellé", def: "Clients satisfaits" },
      { key: "stats.2.value", label: "Chiffre 2 — valeur", def: "250+" },
      { key: "stats.2.label", label: "Chiffre 2 — libellé", def: "Projets réalisés" },
      { key: "stats.3.value", label: "Chiffre 3 — valeur", def: "5+" },
      { key: "stats.3.label", label: "Chiffre 3 — libellé", def: "Années d'expérience" },
      { key: "stats.4.value", label: "Chiffre 4 — valeur", def: "24/7" },
      { key: "stats.4.label", label: "Chiffre 4 — libellé", def: "Support technique" },
      { key: "values.title", label: "Valeurs — titre", def: "Nos valeurs" },
      { key: "values.1.title", label: "Valeur 1 — titre", def: "Innovation" },
      { key: "values.1.desc", label: "Valeur 1 — texte", def: "Toujours à la pointe des nouvelles technologies." },
      { key: "values.2.title", label: "Valeur 2 — titre", def: "Fiabilité" },
      { key: "values.2.desc", label: "Valeur 2 — texte", def: "Des solutions robustes et sécurisées." },
      { key: "values.3.title", label: "Valeur 3 — titre", def: "Engagement" },
      { key: "values.3.desc", label: "Valeur 3 — texte", def: "Un partenaire de confiance à chaque étape." },
      { key: "values.4.title", label: "Valeur 4 — titre", def: "Performance" },
      { key: "values.4.desc", label: "Valeur 4 — texte", def: "Des résultats mesurables et durables." },
    ],
  },
  {
    slug: "services",
    name: "Services",
    route: "/services",
    fields: [
      { key: "hero.eyebrow", label: "Sur-titre", def: "Nos services" },
      { key: "products.title", label: "Produits — sur-titre", def: "Les produits" },
      { key: "products.empty", label: "Produits — message vide", def: "Les produits de ce pôle arrivent très bientôt." },
      { key: "products.cta", label: "Produits — lien carte", def: "Demander" },
      { key: "packs.title", label: "Packs — sur-titre (préfixe)", def: "Nos packs" },
      { key: "packs.cta", label: "Packs — bouton par défaut", def: "Choisir ce pack" },
      { key: "benefit.1.title", label: "Avantage 1 — titre", def: "Installation rapide" },
      { key: "benefit.1.desc", label: "Avantage 1 — texte", def: "En moins de 24 h." },
      { key: "benefit.2.title", label: "Avantage 2 — titre", def: "Performance" },
      { key: "benefit.2.desc", label: "Avantage 2 — texte", def: "Solutions rapides et optimisées." },
      { key: "benefit.3.title", label: "Avantage 3 — titre", def: "Sécurité" },
      { key: "benefit.3.desc", label: "Avantage 3 — texte", def: "Protection et sauvegardes incluses." },
      { key: "benefit.4.title", label: "Avantage 4 — titre", def: "Économies" },
      { key: "benefit.4.desc", label: "Avantage 4 — texte", def: "Jusqu'à 30 % d'économies." },
      { key: "scroll.hint", label: "Indice de scroll", def: "Scroller pour découvrir" },
    ],
  },
  {
    slug: "realisations",
    name: "Réalisations",
    route: "/realisations",
    fields: [
      { key: "hero.eyebrow", label: "Sur-titre", def: "Nos réalisations" },
      { key: "hero.title1", label: "Titre", def: "RÉALISATIONS" },
      { key: "hero.title2", label: "Titre (dégradé)", def: "Premium" },
      {
        key: "hero.subtitle",
        label: "Sous-titre",
        def: "Découvrez une sélection de projets sur mesure, innovants et efficaces réalisés pour nos clients.",
        multiline: true,
      },
      { key: "filter.all", label: "Filtre — tous", def: "Tous" },
      { key: "card.cta", label: "Carte — lien", def: "Voir le projet" },
      { key: "cta.title", label: "Bandeau — titre", def: "Vous avez un projet ?" },
      {
        key: "cta.body",
        label: "Bandeau — texte",
        def: "Discutons ensemble de vos besoins et trouvons la meilleure solution.",
        multiline: true,
      },
      { key: "cta.button", label: "Bandeau — bouton", def: "Demander un devis" },
    ],
  },
  {
    slug: "saas",
    name: "SaaS",
    route: "/saas",
    fields: [
      { key: "hero.eyebrow", label: "Sur-titre", def: "Solutions SaaS" },
      { key: "hero.title1", label: "Titre", def: "Vos outils métiers" },
      { key: "hero.title2", label: "Titre (dégradé)", def: "dans le cloud" },
      {
        key: "hero.subtitle",
        label: "Sous-titre",
        def: "Une suite d'applications SaaS pensée pour piloter votre activité, sans installation ni maintenance.",
        multiline: true,
      },
      { key: "plans.title", label: "Abonnements — sur-titre", def: "Abonnements" },
      { key: "plans.cta", label: "Abonnements — bouton", def: "Choisir" },
      { key: "plans.popular", label: "Badge populaire", def: "Populaire" },
    ],
  },
  {
    slug: "blog",
    name: "Blog",
    route: "/blog",
    fields: [
      { key: "hero.eyebrow", label: "Sur-titre", def: "Blog" },
      { key: "hero.title1", label: "Titre", def: "Actualités &" },
      { key: "hero.title2", label: "Titre (dégradé)", def: "insights" },
      {
        key: "hero.subtitle",
        label: "Sous-titre",
        def: "Décryptages, retours d'expérience et bonnes pratiques par l'équipe DODRICOM.",
        multiline: true,
      },
      { key: "search.placeholder", label: "Recherche — placeholder", def: "Rechercher un article…" },
      { key: "empty", label: "Message aucun article", def: "Aucun article publié pour le moment." },
      { key: "card.cta", label: "Carte — lien", def: "Lire l'article" },
    ],
  },
  {
    slug: "contact",
    name: "Contact",
    route: "/contact",
    fields: [
      { key: "hero.eyebrow", label: "Sur-titre", def: "Contact" },
      { key: "hero.title1", label: "Titre", def: "Parlons de votre" },
      { key: "hero.title2", label: "Titre (dégradé)", def: "projet" },
      {
        key: "hero.subtitle",
        label: "Sous-titre",
        def: "Notre équipe vous répond sous 24 h avec un devis clair et détaillé.",
        multiline: true,
      },
      { key: "info.title", label: "Coordonnées — titre", def: "Nos coordonnées" },
      { key: "info.address.label", label: "Adresse — libellé", def: "Adresse" },
      { key: "info.address.value", label: "Adresse — valeur", def: "Boulevard Zerktouni, Casablanca, Maroc" },
      { key: "info.phone.label", label: "Téléphone — libellé", def: "Téléphone" },
      { key: "info.phone.value", label: "Téléphone — valeur", def: "+212 5 22 00 00 00" },
      { key: "info.email.label", label: "Email — libellé", def: "Email" },
      { key: "info.email.value", label: "Email — valeur", def: "contact@dodricom.com" },
      { key: "info.hours.label", label: "Horaires — libellé", def: "Horaires" },
      { key: "info.hours.value", label: "Horaires — valeur", def: "Lun. – Ven. · 9h – 19h" },
      { key: "info.social", label: "Réseaux — titre", def: "Suivez-nous" },
      { key: "form.name", label: "Formulaire — nom", def: "Nom complet" },
      { key: "form.email", label: "Formulaire — email", def: "Email" },
      { key: "form.phone", label: "Formulaire — téléphone", def: "Téléphone" },
      { key: "form.subject", label: "Formulaire — sujet", def: "Sujet" },
      { key: "form.message", label: "Formulaire — message", def: "Message" },
      { key: "form.placeholder", label: "Formulaire — placeholder message", def: "Décrivez brièvement votre projet…" },
      {
        key: "form.rgpd",
        label: "Formulaire — mention RGPD",
        def: "J'accepte que mes données soient utilisées pour être recontacté conformément au RGPD.",
        multiline: true,
      },
      { key: "form.submit", label: "Formulaire — bouton", def: "Envoyer le message" },
      { key: "form.success", label: "Formulaire — confirmation", def: "Merci ! Nous vous répondons sous 24 h." },
    ],
  },
];

export const TEXT_DEFAULTS: Record<string, string> = Object.fromEntries(
  TEXT_PAGES.flatMap((p) => p.fields.map((f) => [`${p.slug}.${f.key}`, f.def])),
);

/* ---------------------------------------------------------------------- */
/* Images éditables depuis le CMS (hors produits — gérés dans le CRM)      */
/* ---------------------------------------------------------------------- */

export type ImageField = { key: string; label: string };
export type ImagePage = { slug: string; name: string; fields: ImageField[] };

export const IMAGE_PAGES: ImagePage[] = [
  {
    slug: "accueil",
    name: "Accueil",
    fields: [
      { key: "scene.exterior", label: "Scène 1 — extérieur du bâtiment" },
      { key: "scene.doors", label: "Scène 2 — portes vitrées" },
      { key: "scene.reception", label: "Scène 3 — comptoir d'accueil" },
    ],
  },
  // image gérée ailleurs: { slug: "a-propos", name: "À propos", fields: [{ key: "header.bg", label: "Image d'en-tête" }] },
  // image gérée ailleurs: { slug: "services", name: "Services", fields: [{ key: "header.bg", label: "Image d'en-tête" }] },
  { slug: "realisations", name: "Réalisations", fields: [{ key: "header.bg", label: "Image d'en-tête" }] },
  { slug: "saas", name: "SaaS", fields: [{ key: "header.bg", label: "Image d'en-tête" }] },
  // image gérée ailleurs: { slug: "blog", name: "Blog", fields: [{ key: "header.bg", label: "Image d'en-tête" }] },
  { slug: "contact", name: "Contact", fields: [{ key: "header.bg", label: "Image d'en-tête" }] },
];

/* ---------------------------------------------------------------------- */
/* Style par texte + typographie globale                                   */
/* ---------------------------------------------------------------------- */

export type TextStyle = {
  font?: "display" | "body" | "mono";
  size?: string;
  weight?: string;
  color?: string;
  align?: "left" | "center" | "right";
  transform?: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: string;
  lineHeight?: string;
  offsetX?: string;
  offsetY?: string;
  hidden?: boolean;
};

export const FONT_CHOICES = [
  "Space Grotesk",
  "Inter",
  "Poppins",
  "Manrope",
  "Sora",
  "Outfit",
  "DM Sans",
  "Playfair Display",
  "JetBrains Mono",
] as const;

export type Typography = {
  fontDisplay: string;
  fontBody: string;
  scale: number; // multiplicateur global de la taille du texte
};

export const TYPOGRAPHY_DEFAULT: Typography = {
  fontDisplay: "Space Grotesk",
  fontBody: "Inter",
  scale: 1,
};
