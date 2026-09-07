/** Réglages globaux du site pilotés depuis le CMS (stockés dans site_settings). */

export type MaintenanceConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  backgroundUrl: string | null;
  logoUrl: string | null;
  logoSize: number; // px de hauteur du logo
  targetAt: string | null; // ISO date du compte à rebours
};

export const MAINTENANCE_DEFAULT: MaintenanceConfig = {
  enabled: false,
  title: "Something is Happening!",
  subtitle: "Notre nouveau site arrive très bientôt.",
  backgroundUrl: null,
  logoUrl: null,
  logoSize: 72,
  targetAt: null,
};

/** slug de page -> visible dans le front-office */
export type PageVisibility = Record<string, boolean>;

export type CustomButton = {
  id: string;
  label: string;
  url: string;
  variant?: "primary" | "ghost";
  align?: "left" | "center" | "right";
};

export type CustomButtonMap = Record<string, CustomButton[]>;

export const SETTINGS_KEYS = {
  typography: "typography",
  maintenance: "maintenance",
  pageVisibility: "page_visibility",
  customButtons: "cms_custom_buttons",
  customFields: "cms_custom_fields",
  snapshots: "cms_snapshots",
} as const;
