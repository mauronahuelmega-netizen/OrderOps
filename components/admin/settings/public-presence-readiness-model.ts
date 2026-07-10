import { normalizeHexColor } from "@/components/admin/settings/brand-palette";

export type ReadinessItemStatus = "ready" | "optional" | "pending" | "pending-save";

export type ReadinessItem = {
  id: string;
  label: string;
  status: ReadinessItemStatus;
  detail?: string;
};

export type ReadinessSection = {
  id: string;
  title: string;
  items: ReadinessItem[];
};

export type PublicPresenceReadinessInput = {
  identity: {
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    primaryColor?: string | null;
    hasLogo?: boolean;
    hasCover?: boolean;
    pendingLogo?: boolean;
    pendingCover?: boolean;
    pendingColor?: boolean;
  };
  landing: {
    description?: string | null;
    instagramUrl?: string | null;
    pendingDescription?: boolean;
    pendingInstagram?: boolean;
  };
  catalog: {
    headline?: string | null;
    badge?: string | null;
    microcopy?: string | null;
    pendingHeadline?: boolean;
    pendingBadge?: boolean;
    pendingMicrocopy?: boolean;
  };
  publication: {
    slug?: string | null;
    publicUrl?: string | null;
  };
  variant?: "panel" | "compact";
};

const REQUIRED_ITEM_IDS = new Set([
  "logo",
  "cover",
  "brand-color",
  "description",
  "headline",
  "public-url"
]);

const OPTIONAL_ITEM_IDS = new Set(["instagram", "badge", "microcopy"]);

export type PublicPresenceSummaryStats = {
  completedRequiredItems: number;
  totalRequiredItems: number;
  optionalReadyItems: number;
  totalOptionalItems: number;
  pendingRequiredItems: number;
};

export function getFieldReadinessStatus(
  hasValue: boolean,
  pendingSave: boolean
): ReadinessItemStatus {
  if (pendingSave) {
    return "pending-save";
  }

  if (hasValue) {
    return "ready";
  }

  return "pending";
}

export function getOptionalFieldReadinessStatus(
  pendingSave: boolean,
  hasValue: boolean
): ReadinessItemStatus {
  if (pendingSave) {
    return "pending-save";
  }

  if (hasValue) {
    return "ready";
  }

  return "optional";
}

export function getAssetReadinessStatus(
  hasAsset: boolean,
  pendingSave: boolean
): ReadinessItemStatus {
  if (pendingSave) {
    return "pending-save";
  }

  if (hasAsset) {
    return "ready";
  }

  return "pending";
}

export function buildPublicPresenceReadinessSections(
  input: PublicPresenceReadinessInput
): ReadinessSection[] {
  const { identity, landing, catalog, publication } = input;
  const hasLogo = identity.hasLogo ?? Boolean(identity.logoUrl?.trim());
  const hasCover = identity.hasCover ?? Boolean(identity.coverImageUrl?.trim());
  const hasColor = Boolean(normalizeHexColor(identity.primaryColor ?? ""));

  return [
    {
      id: "identity",
      title: "Identidad",
      items: [
        {
          id: "logo",
          label: "Logo",
          status: getAssetReadinessStatus(hasLogo, Boolean(identity.pendingLogo))
        },
        {
          id: "cover",
          label: "Portada",
          status: getAssetReadinessStatus(hasCover, Boolean(identity.pendingCover))
        },
        {
          id: "brand-color",
          label: "Color de marca",
          status: getFieldReadinessStatus(hasColor, Boolean(identity.pendingColor))
        }
      ]
    },
    {
      id: "landing",
      title: "Landing",
      items: [
        {
          id: "description",
          label: "Descripción",
          status: getFieldReadinessStatus(
            Boolean(landing.description?.trim()),
            Boolean(landing.pendingDescription)
          )
        },
        {
          id: "instagram",
          label: "Instagram",
          status: getOptionalFieldReadinessStatus(
            Boolean(landing.pendingInstagram),
            Boolean(landing.instagramUrl?.trim())
          )
        }
      ]
    },
    {
      id: "catalog",
      title: "Catálogo",
      items: [
        {
          id: "headline",
          label: "Título del catálogo",
          status: getFieldReadinessStatus(
            Boolean(catalog.headline?.trim()),
            Boolean(catalog.pendingHeadline)
          )
        },
        {
          id: "badge",
          label: "Badge",
          status: getOptionalFieldReadinessStatus(
            Boolean(catalog.pendingBadge),
            Boolean(catalog.badge?.trim())
          )
        },
        {
          id: "microcopy",
          label: "Microcopy",
          status: getOptionalFieldReadinessStatus(
            Boolean(catalog.pendingMicrocopy),
            Boolean(catalog.microcopy?.trim())
          )
        }
      ]
    },
    {
      id: "publication",
      title: "Publicación",
      items: [
        {
          id: "public-url",
          label: "URL pública",
          status: getFieldReadinessStatus(
            Boolean(publication.slug?.trim() || publication.publicUrl?.trim()),
            false
          )
        }
      ]
    }
  ];
}

export function computePublicPresenceSummaryStats(
  sections: ReadinessSection[]
): PublicPresenceSummaryStats {
  const items = sections.flatMap((section) => section.items);
  const requiredItems = items.filter((item) => REQUIRED_ITEM_IDS.has(item.id));
  const optionalItems = items.filter((item) => OPTIONAL_ITEM_IDS.has(item.id));

  return {
    completedRequiredItems: requiredItems.filter((item) => item.status === "ready").length,
    totalRequiredItems: requiredItems.length,
    optionalReadyItems: optionalItems.filter((item) => item.status === "ready").length,
    totalOptionalItems: optionalItems.length,
    pendingRequiredItems: requiredItems.filter((item) => item.status === "pending").length
  };
}

export function getSectionReadinessCounts(section: ReadinessSection) {
  const readyCount = section.items.filter((item) => item.status === "ready").length;
  const pendingCount = section.items.filter((item) => item.status === "pending").length;

  return {
    readyCount,
    pendingCount,
    totalCount: section.items.length
  };
}
