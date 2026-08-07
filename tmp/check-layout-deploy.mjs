import https from "node:https";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
        });
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      })
      .on("error", reject);
  });
}

const page = await get("https://orderops.vercel.app/admin/login");
const assets = [
  ...new Set([...page.body.matchAll(/\/_next\/static\/[^"'\\\s>]+/g)].map((m) => m[0])),
];
const needles = [
  "max-width:1360px",
  "max-width: 1360px",
  "--preview-phone-frame-width",
  "minmax(420px, 1fr)",
];
const hits = [];
for (const asset of assets) {
  if (!asset.endsWith(".css") && !asset.endsWith(".js")) continue;
  try {
    const r = await get(`https://orderops.vercel.app${asset}`);
    for (const n of needles) {
      if (r.body.includes(n)) hits.push(`${n} @ ${asset}`);
    }
  } catch {
    // ignore
  }
}
console.log(JSON.stringify({ assetCount: assets.length, hits, csp: page.headers["content-security-policy"] }, null, 2));
