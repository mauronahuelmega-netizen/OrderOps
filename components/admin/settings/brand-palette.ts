export const BRAND_PALETTE = [
  { id: "orange-fire", label: "Naranja fuego", value: "#C2410C" },
  { id: "grill-red", label: "Rojo parrilla", value: "#B91C1C" },
  { id: "burgundy", label: "Bordó", value: "#9F1239" },
  { id: "strong-pink", label: "Rosa intenso", value: "#BE185D" },
  { id: "violet", label: "Violeta", value: "#6D28D9" },
  { id: "indigo", label: "Índigo", value: "#4338CA" },
  { id: "blue", label: "Azul", value: "#1D4ED8" },
  { id: "deep-blue", label: "Azul profundo", value: "#0369A1" },
  { id: "teal", label: "Teal", value: "#0F766E" },
  { id: "green", label: "Verde", value: "#15803D" },
  { id: "olive", label: "Oliva", value: "#4D7C0F" },
  { id: "toasted-amber", label: "Ámbar tostado", value: "#B45309" },
  { id: "deep-gold", label: "Dorado profundo", value: "#A16207" },
  { id: "brown", label: "Marrón", value: "#92400E" },
  { id: "graphite", label: "Grafito", value: "#334155" },
  { id: "soft-black", label: "Negro suave", value: "#111827" }
] as const;

export function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) {
    return null;
  }

  return withHash.toUpperCase();
}

export function isPaletteColor(color: string) {
  const normalized = normalizeHexColor(color);

  if (!normalized) {
    return false;
  }

  return BRAND_PALETTE.some((entry) => entry.value === normalized);
}

export function getLegacyBrandColor(color: string) {
  const normalized = normalizeHexColor(color);

  if (!normalized || isPaletteColor(normalized)) {
    return null;
  }

  return normalized;
}
