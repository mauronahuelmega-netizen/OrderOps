import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
const BG = "#0f172a";
const INDIGO = "#4f46e5";

function buildMarkSvg(size, { maskable }) {
  const safeInset = maskable ? size * 0.1 : size * 0.12;
  const panelSize = size - safeInset * 2;
  const panelX = safeInset;
  const panelY = safeInset;
  const panelRadius = panelSize * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  const ringR = panelSize * 0.28;
  const stroke = Math.max(2, size * 0.07);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect x="${panelX}" y="${panelY}" width="${panelSize}" height="${panelSize}" rx="${panelRadius}" fill="${INDIGO}"/>
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="#ffffff" stroke-width="${stroke}"/>
</svg>`;
}

async function writeIcon(fileName, size, options) {
  const svg = buildMarkSvg(size, options);
  const outPath = path.join(OUT_DIR, fileName);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log("wrote", outPath);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await writeIcon("orderops-admin-pwa-192.png", 192, { maskable: false });
  await writeIcon("orderops-admin-pwa-512.png", 512, { maskable: false });
  await writeIcon("orderops-admin-maskable-512.png", 512, { maskable: true });
  await writeIcon("orderops-admin-apple-180.png", 180, { maskable: false });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});