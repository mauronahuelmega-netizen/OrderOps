/**
 * Product-images Storage path helpers (Products write-side lifecycle).
 * Bucket: product-images. Object path: {businessId}/{productOrTmpFolder}/{fileName}
 */

export const PRODUCT_IMAGES_BUCKET = "product-images";

export type ProductImageIntent = "keep" | "replace" | "remove" | "none";

export type ProductImageCleanupStatus =
  | "deleted"
  | "skipped_referenced"
  | "skipped_invalid"
  | "failed";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PUBLIC_OBJECT_MARKER = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

export function isCanonicalProductUuid(value: string) {
  return UUID_RE.test(value);
}

export function buildProductImageObjectPath(input: {
  businessId: string;
  productId: string;
  fileName: string;
}) {
  return `${input.businessId}/${input.productId}/${input.fileName}`;
}

export function splitProductImageObjectPath(path: string) {
  const normalized = path.replace(/^\/+/, "").split("?")[0] ?? "";
  const parts = normalized.split("/").filter((segment) => segment.length > 0);

  if (parts.length !== 3) {
    return null;
  }

  if (parts.some((segment) => segment === "." || segment === "..")) {
    return null;
  }

  return {
    businessId: parts[0],
    productFolder: parts[1],
    fileName: parts[2]
  };
}

export function isOwnedProductImagePath(
  path: string,
  businessId: string,
  options?: { requireCanonicalProductFolder?: boolean }
) {
  const parts = splitProductImageObjectPath(path);
  if (!parts) {
    return false;
  }

  if (parts.businessId !== businessId) {
    return false;
  }

  if (!parts.productFolder || !parts.fileName) {
    return false;
  }

  if (options?.requireCanonicalProductFolder) {
    return isCanonicalProductUuid(parts.productFolder);
  }

  return true;
}

export function parseProductImageStoragePathFromPublicUrl(
  imageUrl: string,
  expectedBusinessId: string
) {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return null;
  }

  let pathname: string;
  try {
    pathname = new URL(trimmed).pathname;
  } catch {
    return null;
  }

  const markerIndex = pathname.indexOf(PUBLIC_OBJECT_MARKER);
  if (markerIndex === -1) {
    return null;
  }

  const encodedPath = pathname.slice(markerIndex + PUBLIC_OBJECT_MARKER.length);
  let objectPath: string;
  try {
    objectPath = decodeURIComponent(encodedPath);
  } catch {
    return null;
  }

  if (!isOwnedProductImagePath(objectPath, expectedBusinessId)) {
    return null;
  }

  return objectPath;
}

export function resolveProductImageObjectPath(
  imageUrlOrPath: string,
  businessId: string
) {
  const trimmed = imageUrlOrPath.trim();
  if (!trimmed) {
    return null;
  }

  if (isOwnedProductImagePath(trimmed, businessId)) {
    return trimmed;
  }

  return parseProductImageStoragePathFromPublicUrl(trimmed, businessId);
}

type ProductImageCleanupClient = {
  from: (relation: string) => any;
  storage: {
    from: (bucket: string) => {
      remove: (
        paths: string[]
      ) => Promise<{ data: unknown; error: { message?: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

export async function removeProductImageIfUnreferenced(input: {
  supabase: ProductImageCleanupClient;
  businessId: string;
  imageUrlOrPath: string;
}): Promise<ProductImageCleanupStatus> {
  const targetPath = resolveProductImageObjectPath(
    input.imageUrlOrPath,
    input.businessId
  );

  if (!targetPath) {
    return "skipped_invalid";
  }

  const { data, error } = await input.supabase
    .from("products")
    .select("image_url")
    .eq("business_id", input.businessId)
    .not("image_url", "is", null);

  if (error) {
    return "failed";
  }

  const rows = (data ?? []) as Array<{ image_url: string | null }>;
  const stillReferenced = rows.some((row) => {
    if (!row.image_url) {
      return false;
    }

    const referencedPath = resolveProductImageObjectPath(
      row.image_url,
      input.businessId
    );
    return referencedPath === targetPath;
  });

  if (stillReferenced) {
    return "skipped_referenced";
  }

  const { error: removeError } = await input.supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([targetPath]);

  if (removeError) {
    return "failed";
  }

  return "deleted";
}

export function getCanonicalProductImagePublicUrl(
  supabase: ProductImageCleanupClient,
  objectPath: string
) {
  return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath).data
    .publicUrl;
}
