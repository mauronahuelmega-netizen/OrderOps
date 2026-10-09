import type { Metadata } from "next";
import MarketingLanding from "@/components/marketing/marketing-landing";
import { marketingConfig } from "@/components/marketing/marketing-config";

const title = "OrderOps | Gestión de pedidos para tu negocio";
const description = "Creá tu catálogo online, recibí pedidos con toda la información y gestioná cada uno hasta completarlo. Tu operación organizada, sin dejar WhatsApp.";

export const metadata: Metadata = {
  title,
  description,
  ...(marketingConfig.siteOrigin ? { metadataBase: new URL(marketingConfig.siteOrigin), alternates: { canonical: "/" } } : {}),
  openGraph: {
    title, description, type: "website", locale: "es_AR", siteName: "OrderOps",
    ...(marketingConfig.siteOrigin ? { url: marketingConfig.siteOrigin } : {}),
    ...(marketingConfig.siteOrigin ? { images: [{ url: "/marketing/orderops-social.png", width: 1200, height: 630, alt: "OrderOps. Dejá de tomar pedidos. Empezá a recibirlos." }] } : {})
  },
  twitter: { card: "summary_large_image", title, description, ...(marketingConfig.siteOrigin ? { images: ["/marketing/orderops-social.png"] } : {}) }
};

export default function HomePage() {
  return <MarketingLanding />;
}
