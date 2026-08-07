import https from "node:https";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      })
      .on("error", reject);
  });
}

const needles = [
  "ORDEROPS_PREVIEW_CLEAR_CART",
  "ORDEROPS_PREVIEW_CLEAR_CART_ACK",
  "preview-phone-frame-width",
  "data-preview-touch-cursor",
  "data-preview-pan-enabled",
  "Modo seguro activo",
  "Vaciar carrito de prueba",
];

async function scan(url) {
  const page = await get(url);
  const assets = [
    ...new Set(
      [...page.body.matchAll(/\/_next\/static\/[^"'\\\s>]+/g)].map((m) => m[0])
    ),
  ];
  const hits = [];
  for (const asset of assets) {
    if (!asset.endsWith(".js") && !asset.endsWith(".css")) continue;
    const abs = `https://orderops.vercel.app${asset}`;
    try {
      const r = await get(abs);
      for (const needle of needles) {
        if (r.body.includes(needle)) {
          hits.push(`${needle} @ ${asset}`);
        }
      }
    } catch {
      // ignore
    }
  }
  // also scan HTML itself for RSC embedded strings
  for (const needle of needles) {
    if (page.body.includes(needle)) {
      hits.push(`${needle} @ HTML`);
    }
  }
  return { url, status: page.status, assets: assets.length, hits };
}

const targets = [
  "https://orderops.vercel.app/b/demohamburgueseria/catalogo",
  "https://orderops.vercel.app/admin/login",
];

for (const target of targets) {
  const result = await scan(target);
  console.log(JSON.stringify(result, null, 2));
}
