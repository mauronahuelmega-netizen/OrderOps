/**
 * ADMIN PWA icons — derived from the same web tab branding asset.
 *
 * Source (do not invent a new mark):
 *   public/icon.png  — OrderOps interlocking rings (also referenced by app/layout.tsx as /icon.png)
 *
 * Outputs (admin PWA only):
 *   public/icons/orderops-admin-pwa-192.png
 *   public/icons/orderops-admin-pwa-512.png
 *   public/icons/orderops-admin-maskable-512.png
 *   public/icons/orderops-admin-apple-180.png
 *
 * No remote downloads. No new dependencies (uses sharp already in package.json).
 * Does not rewrite public/icon.png or favicon.ico.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.join(process.cwd(), "public", "icon.png");
const OUT_DIR = path.join(process.cwd(), "public", "icons");

/** White matches the circular disc of the web mark; keeps launcher/tab consistency. */
const CANVAS_BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function renderIcon(size, { maskable }) {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing web brand source: ${SOURCE}`);
  }

  // Maskable: keep mark inside ~80% safe zone. Any/apple: tighter padding, still square.
  const insetRatio = maskable ? 0.14 : 0.06;
  const inset = Math.round(size * insetRatio);
  const markSize = size - inset * 2;

  const mark = await sharp(SOURCE)
    .resize(markSize, markSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: CANVAS_BG
    }
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png();
}

async function writeIcon(fileName, size, options) {
  const outPath = path.join(OUT_DIR, fileName);
  await (await renderIcon(size, options)).toFile(outPath);
  console.log("wrote", outPath);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await writeIcon("orderops-admin-pwa-192.png", 192, { maskable: false });
  await writeIcon("orderops-admin-pwa-512.png", 512, { maskable: false });
  await writeIcon("orderops-admin-maskable-512.png", 512, { maskable: true });
  await writeIcon("orderops-admin-apple-180.png", 180, { maskable: false });

  const files = [
    "orderops-admin-pwa-192.png",
    "orderops-admin-pwa-512.png",
    "orderops-admin-maskable-512.png",
    "orderops-admin-apple-180.png"
  ];
  for (const file of files) {
    const meta = await sharp(path.join(OUT_DIR, file)).metadata();
    console.log("verify", file, meta.width, meta.height, meta.format);
  }

  const sourceMeta = await sharp(SOURCE).metadata();
  console.log(
    "source",
    SOURCE,
    sourceMeta.width,
    sourceMeta.height,
    sourceMeta.format
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
