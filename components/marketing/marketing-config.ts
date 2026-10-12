/** Public commercial configuration only. Never use a tenant or support contact. */
export type MarketingConfig = {
  siteOrigin: string | null;
  whatsappNumber: string | null;
  legalLinks: ReadonlyArray<{ label: string; href: string }>;
};

export function normalizeMarketingOrigin(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}

export function normalizeMarketingPhone(value?: string): string | null {
  if (!value?.trim() || !/^\+?[\d\s()-]+$/.test(value.trim())) return null;
  const digits = value.replace(/\D/g, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export const marketingConfig: MarketingConfig = {
  siteOrigin: normalizeMarketingOrigin(process.env.ORDEROPS_MARKETING_SITE_ORIGIN),
  whatsappNumber: normalizeMarketingPhone(process.env.ORDEROPS_MARKETING_WHATSAPP),
  legalLinks: []
};

export function getMarketingContactUrl(kind: "demo" | "whatsapp", number = marketingConfig.whatsappNumber): string | null {
  const normalized = normalizeMarketingPhone(number ?? undefined);
  if (!normalized) return null;
  const message = kind === "demo"
    ? "Hola, quiero solicitar una demo de OrderOps para mi negocio."
    : "Hola, quiero consultar sobre OrderOps para mi negocio.";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
