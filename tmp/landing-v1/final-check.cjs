const fs = require("node:fs");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const baseline = JSON.parse(fs.readFileSync("tmp/landing-v1/baseline.json", "utf8"));
const allowed = new Set(["app/page.tsx", "app/layout.tsx", "app/theme-tokens.css", ".env.example"]);
const unrelatedChanges = [];
for (const [file, hash] of Object.entries(baseline.hashes)) {
  if (!allowed.has(file) && (!fs.existsSync(file) || crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") !== hash)) unrelatedChanges.push(file);
}
const git = args => cp.execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const result = {
  unrelatedChanges,
  headUnchanged: git(["rev-parse", "HEAD"]) === baseline.head,
  indexUnchanged: git(["diff", "--cached", "--raw"]) === baseline.index,
  rootPrerendered: Boolean(JSON.parse(fs.readFileSync(".next/prerender-manifest.json", "utf8")).routes["/"]),
  http: []
};
(async () => {
  if (process.argv.includes("--no-http")) result.http = JSON.parse(fs.readFileSync("tmp/landing-v1/final-check.json", "utf8")).http;
  for (const route of process.argv.includes("--no-http") ? [] : ["/", "/admin/login", "/admin/dashboard", "/admin/login?error=invalid_credentials"]) {
    const response = await fetch("http://localhost:3000" + route, { redirect: "manual" });
    const html = await response.text();
    result.http.push({ route, status: response.status, redirect: response.headers.get("location"), loginForm: html.includes('name="password"'), credentialErrorCopy: html.includes("No pudimos validar tus credenciales") });
  }
  fs.writeFileSync("tmp/landing-v1/final-check.json", JSON.stringify(result, null, 2));
  fs.writeFileSync("tmp/landing-v1/git-diff-stat.txt", git(["diff", "--stat"]));
  fs.writeFileSync("tmp/landing-v1/landing-tracked-diff-stat.txt", git(["diff", "--stat", "--", ...allowed]));
  console.log(JSON.stringify(result, null, 2));
  if (unrelatedChanges.length || !result.headUnchanged || !result.indexUnchanged) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
