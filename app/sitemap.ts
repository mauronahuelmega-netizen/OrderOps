import type { MetadataRoute } from "next";
import { marketingConfig } from "@/components/marketing/marketing-config";

/** Only the commercial root. Tenant indexing policy is intentionally unchanged. */
export default function sitemap(): MetadataRoute.Sitemap {
  return marketingConfig.siteOrigin ? [{ url: `${marketingConfig.siteOrigin}/` }] : [];
}
