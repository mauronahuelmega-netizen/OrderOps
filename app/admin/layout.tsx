import type { Metadata, Viewport } from "next";
import {
  ADMIN_PWA_APPLE_TOUCH_180,
  ADMIN_PWA_DESCRIPTION,
  ADMIN_PWA_NAME,
  ADMIN_PWA_THEME_COLOR
} from "@/lib/admin/pwa-manifest";

export const metadata: Metadata = {
  applicationName: ADMIN_PWA_NAME,
  title: {
    default: ADMIN_PWA_NAME,
    template: `%s | ${ADMIN_PWA_NAME}`
  },
  description: ADMIN_PWA_DESCRIPTION,
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: ADMIN_PWA_NAME,
    statusBarStyle: "black-translucent"
  },
  icons: {
    apple: [{ url: ADMIN_PWA_APPLE_TOUCH_180, sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: ADMIN_PWA_THEME_COLOR
};

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}