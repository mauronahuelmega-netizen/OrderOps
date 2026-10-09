/**
 * Client-side product image optimization (pre-Storage staging).
 * Decode → resize (Pica) → WebP encode. No React / Supabase / Storage.
 */

export const PRODUCT_IMAGE_MAX_DIMENSION = 800;
export const PRODUCT_IMAGE_MIN_DIMENSION_FALLBACK = 640;
export const PRODUCT_IMAGE_TARGET_BYTES = 90 * 1024;
/** Quality-preserving outlier ceiling — not a target; selection may accept ≤ this after ≤90 fails. */
export const PRODUCT_IMAGE_OUTLIER_MAX_BYTES = 150 * 1024;
export const PRODUCT_IMAGE_INITIAL_QUALITY = 0.8;
export const PRODUCT_IMAGE_MIN_QUALITY = 0.6;
export const PRODUCT_IMAGE_WEBP_MIME = "image/webp";

const DIMENSION_STEPS = [800, 720, 640] as const;
const QUALITY_STEPS = [0.8, 0.75, 0.7, 0.65, 0.6] as const;

export type SizedOptimizationCandidate = {
  quality: number;
  size: number;
};

export type DimensionCandidateGroup = {
  maxDimension: number;
  /** High → low quality order. */
  candidates: readonly SizedOptimizationCandidate[];
};

export type OptimizationSelectionOutcome = {
  maxDimension: number;
  quality: number;
  size: number;
  kind: "preferred" | "outlier" | "bestOverall";
};

/**
 * Largest-dimension-first selection (pure).
 *
 * Per dimension (high → low quality):
 * - return immediately on ≤ preferred target (90 KiB);
 * - remember first ≤ outlier ceiling (150 KiB) as highest-quality acceptable outlier;
 * - after ladder: return that outlier if present;
 * - else try next smaller dimension.
 * Pathological: return bestOverall (smallest size, then higher quality).
 */
export function selectLargestDimensionFirstCandidate(
  groups: readonly DimensionCandidateGroup[],
  targetBytes: number = PRODUCT_IMAGE_TARGET_BYTES,
  outlierMaxBytes: number = PRODUCT_IMAGE_OUTLIER_MAX_BYTES
): OptimizationSelectionOutcome | null {
  let bestOverall: OptimizationSelectionOutcome | null = null;

  for (const group of groups) {
    let bestAcceptableOutlier: OptimizationSelectionOutcome | null = null;

    for (const candidate of group.candidates) {
      const sized: OptimizationSelectionOutcome = {
        maxDimension: group.maxDimension,
        quality: candidate.quality,
        size: candidate.size,
        kind: "bestOverall"
      };

      if (
        !bestOverall ||
        candidate.size < bestOverall.size ||
        (candidate.size === bestOverall.size &&
          candidate.quality > bestOverall.quality)
      ) {
        bestOverall = sized;
      }

      if (candidate.size <= targetBytes) {
        return {
          maxDimension: group.maxDimension,
          quality: candidate.quality,
          size: candidate.size,
          kind: "preferred"
        };
      }

      if (
        candidate.size <= outlierMaxBytes &&
        bestAcceptableOutlier === null
      ) {
        bestAcceptableOutlier = {
          maxDimension: group.maxDimension,
          quality: candidate.quality,
          size: candidate.size,
          kind: "outlier"
        };
      }
    }

    if (bestAcceptableOutlier) {
      return bestAcceptableOutlier;
    }
  }

  return bestOverall;
}

const RASTER_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ProductImageOptimizationError extends Error {
  constructor(message = "No pudimos procesar la imagen. Probá con otra foto.") {
    super(message);
    this.name = "ProductImageOptimizationError";
  }
}

export function isHeicFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (
    mime === "image/heic" ||
    mime === "image/heif" ||
    mime === "image/heic-sequence" ||
    mime === "image/heif-sequence"
  ) {
    return true;
  }

  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

export function isSupportedProductImageInput(file: File): boolean {
  if (!(file instanceof File) || file.size <= 0) {
    return false;
  }

  const mime = (file.type || "").toLowerCase();
  if (RASTER_MIME.has(mime)) {
    return true;
  }

  return isHeicFile(file);
}

function buildWebpFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "").trim() || "product-image";
  const safe = base.replace(/[^\w.-]+/g, "-").slice(0, 80) || "product-image";
  return `${safe}.webp`;
}

async function decodeHeicToBitmapSource(file: File): Promise<Blob> {
  const { heicTo } = await import("heic-to");
  const converted = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.92
  });

  if (!(converted instanceof Blob) || converted.size <= 0) {
    throw new ProductImageOptimizationError();
  }

  return converted;
}

async function loadImageBitmap(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, {
      imageOrientation: "from-image"
    } as ImageBitmapOptions);
  } catch {
    return await createImageBitmap(source);
  }
}

function computeTargetSize(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const largest = Math.max(width, height);
  if (largest <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / largest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function resizeWithPica(
  bitmap: ImageBitmap,
  maxDimension: number
): Promise<HTMLCanvasElement> {
  const { width, height } = computeTargetSize(
    bitmap.width,
    bitmap.height,
    maxDimension
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  if (width === bitmap.width && height === bitmap.height) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new ProductImageOptimizationError();
    }
    context.drawImage(bitmap, 0, 0);
    return canvas;
  }

  const PicaFactory = (await import("pica")).default;
  const pica = PicaFactory();
  await pica.resize(bitmap, canvas, {
    quality: 3
  });
  return canvas;
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size <= 0) {
          reject(new ProductImageOptimizationError());
          return;
        }
        resolve(blob);
      },
      PRODUCT_IMAGE_WEBP_MIME,
      quality
    );
  });
}

async function encodeBoundedWebp(
  bitmap: ImageBitmap
): Promise<{ blob: Blob; quality: number; maxDimension: number }> {
  type Encoded = { blob: Blob; quality: number; maxDimension: number; size: number };

  let bestOverall: Encoded | null = null;

  for (const maxDimension of DIMENSION_STEPS) {
    const canvas = await resizeWithPica(bitmap, maxDimension);
    let bestAcceptableOutlier: Encoded | null = null;

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToWebpBlob(canvas, quality);
      const encoded: Encoded = {
        blob,
        quality,
        maxDimension,
        size: blob.size
      };

      if (
        !bestOverall ||
        encoded.size < bestOverall.size ||
        (encoded.size === bestOverall.size && quality > bestOverall.quality)
      ) {
        bestOverall = encoded;
      }

      // Preferred ≤90 KiB — accept immediately at current dimension.
      if (encoded.size <= PRODUCT_IMAGE_TARGET_BYTES) {
        return encoded;
      }

      // First ≤150 KiB at this dimension = highest-quality acceptable outlier
      // (qualities iterate high → low). Keep searching for ≤90.
      if (
        encoded.size <= PRODUCT_IMAGE_OUTLIER_MAX_BYTES &&
        bestAcceptableOutlier === null
      ) {
        bestAcceptableOutlier = encoded;
      }
    }

    // Prefer keeping this dimension with a ≤150 KiB outlier over shrinking.
    if (bestAcceptableOutlier) {
      return bestAcceptableOutlier;
    }
  }

  if (!bestOverall) {
    throw new ProductImageOptimizationError();
  }

  return bestOverall;
}

/**
 * Optimize a (typically post-crop) product image for Storage staging.
 * Returns a WebP File. Does not upload.
 */
export async function optimizeProductImage(file: File): Promise<File> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new ProductImageOptimizationError();
  }

  if (!isSupportedProductImageInput(file) && !file.type.startsWith("image/")) {
    throw new ProductImageOptimizationError();
  }

  let decodeSource: Blob = file;

  try {
    if (isHeicFile(file)) {
      decodeSource = await decodeHeicToBitmapSource(file);
    }

    const bitmap = await loadImageBitmap(decodeSource);
    try {
      const { blob } = await encodeBoundedWebp(bitmap);
      return new File([blob], buildWebpFileName(file.name), {
        type: PRODUCT_IMAGE_WEBP_MIME,
        lastModified: Date.now()
      });
    } finally {
      bitmap.close();
    }
  } catch (error) {
    if (error instanceof ProductImageOptimizationError) {
      throw error;
    }
    throw new ProductImageOptimizationError();
  }
}

/**
 * Prepare an input File for the crop modal (HEIC → browser-readable JPEG Blob).
 * Lazy-loads HEIC decoder only when needed. Does not upload.
 */
export async function prepareProductImageForCrop(file: File): Promise<{
  previewSrc: string;
  revoke?: () => void;
}> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new ProductImageOptimizationError();
  }

  if (isHeicFile(file)) {
    const jpegBlob = await decodeHeicToBitmapSource(file);
    const objectUrl = URL.createObjectURL(jpegBlob);
    return {
      previewSrc: objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl)
    };
  }

  const mime = (file.type || "").toLowerCase();
  if (!mime.startsWith("image/") && !isSupportedProductImageInput(file)) {
    throw new ProductImageOptimizationError();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ previewSrc: reader.result });
        return;
      }
      reject(new ProductImageOptimizationError());
    };
    reader.onerror = () => reject(new ProductImageOptimizationError());
    reader.readAsDataURL(file);
  });
}
