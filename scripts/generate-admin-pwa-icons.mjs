import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
const BG = "#0f172a";
const INDIGO = "#4f46e5";

function buildMarkSvg(size, { maskable }) {
  const safeInset = maskable ? size * 0.1 : size * 0.08;
  const panelSize = size - safeInset * 2;
  const panelX = safeInset;
  const panelY = safeInset;
  const panelRadius = panelSize * 0.22;
  const cx = size / 2;
  const stroke = Math.max(2, size * 0.028);
  const lineW = panelSize * 0.42;
  const lineH = Math.max(2, size * 0.022);
  const lineX = cx - lineW / 2;
  const lineYStart = panelY + panelSize * 0.2;
  const lineGap = panelSize * 0.09;
  const ringR = panelSize * 0.09;
  const ringY = panelY + panelSize * 0.46;
  const ringOffset = panelSize * 0.075;
  const opsSize = panelSize * 0.34;
  const opsY = panelY + panelSize * 0.78;

  const lines = [0, 1, 2]
    .map(
      (i) =>
        `<rect x="${lineX}" y="${lineYStart + i * lineGap}" width="${lineW * (1 - i * 0.12)}" height="${lineH}" rx="${lineH / 2}" fill="#ffffff" opacity="0.88"/>`
    )
    .join("\n  ");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect x="${panelX}" y="${panelY}" width="${panelSize}" height="${panelSize}" rx="${panelRadius}" fill="${INDIGO}"/>
  ${lines}
  <circle cx="${cx - ringOffset}" cy="${ringY}" r="${ringR}" fill="none" stroke="#ffffff" stroke-width="${stroke}"/>
  <circle cx="${cx + ringOffset}" cy="${ringY}" r="${ringR}" fill="none" stroke="#ffffff" stroke-width="${stroke}" opacity="0.92"/>
  <text x="${cx}" y="${opsY}" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${opsSize}" font-weight="700" letter-spacing="${opsSize * 0.02}">Ops</text>
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

  const files = [
    "orderops-admin-pwa-192.png",
    "orderops-admin-pwa-512.png",
    "orderops-admin-maskable-512.png",
    "orderops-admin-apple-180.png"
  ];
  for (const file of files) {
    const meta = await sharp(path.join(OUT_DIR, file)).metadata();
    console.log("verify", file, meta.width, meta.height);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
