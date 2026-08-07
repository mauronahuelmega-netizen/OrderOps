import sharp from "sharp";
const a = await sharp("public/icon.png").raw().resize(32,32).toBuffer();
const b = await sharp("public/icons/orderops-admin-pwa-192.png").raw().resize(32,32).toBuffer();
let diff = 0;
for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
console.log("byte diffs at 32x32", diff, "of", a.length);
const meta = await sharp("public/icon.png").stats();
console.log("icon.png dominant", meta.dominant);
