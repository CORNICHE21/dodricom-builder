import imgDomo from "@/assets/service-domotique.jpg";
import imgDigital from "@/assets/service-digital.jpg";
import imgReseaux from "@/assets/service-reseaux.jpg";
import imgIA from "@/assets/service-ia.jpg";
import imgComm from "@/assets/service-communication.jpg";
import imgEvents from "@/assets/service-events.jpg";

import pAmpoule from "@/assets/products/ampoule-connectee.jpg";
import pBorne from "@/assets/products/borne-wifi6.jpg";
import pVitrine from "@/assets/products/pack-site-vitrine.jpg";
import pAgentIA from "@/assets/products/agent-ia-support.jpg";
import pBranding from "@/assets/products/pack-branding.jpg";
import pLed from "@/assets/products/ecran-led-outdoor.jpg";
import pSerrure from "@/assets/products/serrure-intelligente.jpg";
import pSwitch from "@/assets/products/switch-poe-24.jpg";
import pThermostat from "@/assets/products/thermostat-smart.jpg";
import pBaie from "@/assets/products/baie-42u.jpg";
import pCamera from "@/assets/products/camera-4k.jpg";

/** Fallback visuals used until the CMS media library provides an image URL. */
export const CATEGORY_IMAGES: Record<string, string> = {
  domotique: imgDomo,
  digital: imgDigital,
  reseaux: imgReseaux,
  ia: imgIA,
  communication: imgComm,
  events: imgEvents,
};

export const PRODUCT_IMAGES: Record<string, string> = {
  "ampoule-connectee": pAmpoule,
  "borne-wifi6": pBorne,
  "pack-site-vitrine": pVitrine,
  "agent-ia-support": pAgentIA,
  "pack-branding": pBranding,
  "ecran-led-outdoor": pLed,
  "serrure-intelligente": pSerrure,
  "switch-poe-24": pSwitch,
  "thermostat-smart": pThermostat,
  "baie-42u": pBaie,
  "camera-4k": pCamera,
};

export function productImage(slug: string, url?: string | null, categorySlug?: string | null) {
  return url ?? PRODUCT_IMAGES[slug] ?? CATEGORY_IMAGES[categorySlug ?? ""] ?? imgDigital;
}

export function categoryImage(slug: string, url?: string | null) {
  return url ?? CATEGORY_IMAGES[slug] ?? imgDigital;
}