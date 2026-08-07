import fs from "node:fs";
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

const page = await get("https://orderops.vercel.app/b/demohamburgueseria/catalogo");
fs.writeFileSync("tmp/prod-catalogo.html", page.body);
const assets = [...page.body.matchAll(/\/_next\/static\/[^"'\\\s>]+/g)].map((m) => m[0]);
const unique = [...new Set(assets)];
console.log("status", page.status);
console.log("buildId", (page.body.match(/"buildId":"([^"]+)"/) || [])[1] || "n/a");
console.log("assetCount", unique.length);
console.log(unique.slice(0, 40).join("\n"));
console.log("---html-head---");
console.log(page.body.slice(0, 800));
