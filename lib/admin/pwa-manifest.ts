export const ADMIN_PWA_NAME = "OrderOps";
export const ADMIN_PWA_SHORT_NAME = "OrderOps";
export const ADMIN_PWA_DESCRIPTION = "Panel operativo de OrderOps";
export const ADMIN_PWA_START_URL = "/admin";
export const ADMIN_PWA_SCOPE = "/admin";
export const ADMIN_PWA_ID = "/admin";
export const ADMIN_PWA_DISPLAY = "standalone";
export const ADMIN_PWA_THEME_COLOR = "#4f46e5";
export const ADMIN_PWA_BACKGROUND_COLOR = "#0f172a";
export const ADMIN_PWA_ICON_192 = "/icons/orderops-admin-pwa-192.png";
export const ADMIN_PWA_ICON_512 = "/icons/orderops-admin-pwa-512.png";
export const ADMIN_PWA_ICON_MASKABLE_512 = "/icons/orderops-admin-maskable-512.png";
export const ADMIN_PWA_APPLE_TOUCH_180 = "/icons/orderops-admin-apple-180.png";

export type AdminWebAppManifest = {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  id: string;
  display: typeof ADMIN_PWA_DISPLAY;
  theme_color: string;
  background_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: "image/png";
    purpose?: "any" | "maskable";
  }>;
};

export function buildAdminWebAppManifest(): AdminWebAppManifest {
  return {
    name: ADMIN_PWA_NAME,
    short_name: ADMIN_PWA_SHORT_NAME,
    description: ADMIN_PWA_DESCRIPTION,
    start_url: ADMIN_PWA_START_URL,
    scope: ADMIN_PWA_SCOPE,
    id: ADMIN_PWA_ID,
    display: ADMIN_PWA_DISPLAY,
    theme_color: ADMIN_PWA_THEME_COLOR,
    background_color: ADMIN_PWA_BACKGROUND_COLOR,
    icons: [
      {
        src: ADMIN_PWA_ICON_192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: ADMIN_PWA_ICON_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: ADMIN_PWA_ICON_MASKABLE_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}