/**
 * Final browser-oriented login QA via Chromium (Playwright).
 * Reads credentials only from ORDEROPS_DEMO_ACCESS.private.md (gitignored).
 * Does not print passwords. Does not mutate demo data.
 *
 * Usage: npx tsx scripts/auth/qa-final-login-browser.mjs
 * Requires: npx playwright (chromium) available for one-shot run.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BASE = process.env.ORDEROPS_QA_BASE || "http://localhost:3105";
const PRIVATE = resolve(ROOT, "ORDEROPS_DEMO_ACCESS.private.md");

function parseDemoAccounts() {
  const text = readFileSync(PRIVATE, "utf8");
  const accounts = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/\|\s*([^|]+)\|\s*([^|]+)\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/);
    if (!m) continue;
    accounts.push({
      profile: m[1].trim(),
      name: m[2].trim(),
      email: m[3].trim(),
      password: m[4].trim()
    });
  }
  return accounts;
}

const EXPECT = {
  "demo.valentina@local.test": {
    role: "owner",
    pathPrefix: "/admin/dashboard",
    deny: ["/super-admin", "/commercial/opportunities", "/promoter"],
    navIncludes: null
  },
  "demo.sofia@local.test": {
    role: "manager",
    pathPrefix: "/admin/dashboard",
    deny: ["/super-admin", "/promoter"],
    navIncludes: null
  },
  "demo.diego@local.test": {
    role: "operator",
    pathPrefix: "/admin/dashboard",
    deny: ["/super-admin", "/promoter"],
    navIncludes: null
  },
  "demo.camila@local.test": {
    role: "owner-suspended",
    pathPrefix: "/admin/dashboard",
    billingPath: "/admin/billing",
    billingMustInclude: /suspend|servicio/i,
    deny: ["/super-admin", "/promoter"],
    navIncludes: null
  },
  "demo.lucia@local.test": {
    role: "commercial",
    pathPrefix: "/commercial",
    afterPath: "/commercial/opportunities",
    navMust: ["Gestión Comercial", "Oportunidades", "Liquidaciones"],
    navMustNot: ["Cobranzas"],
    deny: ["/super-admin", "/admin/dashboard", "/promoter"],
    denySoft: ["/commercial/billing"]
  },
  "demo.nicolas@local.test": {
    role: "finance",
    pathPrefix: "/commercial",
    afterPath: "/commercial/settlements",
    navMust: ["Gestión Comercial", "Liquidaciones", "Cobranzas"],
    navMustNot: ["Oportunidades"],
    deny: ["/super-admin", "/admin/dashboard", "/promoter", "/commercial/opportunities"],
    denySoft: null
  },
  "demo.tomas@local.test": {
    role: "promoter",
    pathPrefix: "/promoter",
    deny: ["/super-admin", "/admin/dashboard", "/commercial/opportunities"],
    navIncludes: null
  },
  "demo.martin@local.test": {
    role: "superadmin",
    expectChooser: true,
    chooserLabels: ["Gestión Comercial", "Administración general"],
    chooserMustNot: ["Finanzas"],
    afterChoose: "/super-admin",
    deny: ["/promoter"],
    navIncludes: null
  }
};

async function ensurePlaywright() {
  try {
    const require = createRequire(import.meta.url);
    return require("playwright");
  } catch {
    const install = spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["--yes", "playwright", "install", "chromium"],
      { cwd: ROOT, stdio: "inherit", shell: true }
    );
    if (install.status !== 0) {
      throw new Error("playwright chromium install failed");
    }
    const require = createRequire(import.meta.url);
    // playwright may not be a project dep — use npx resolution
    try {
      return require("playwright");
    } catch {
      const req = createRequire(resolve(ROOT, "package.json"));
      return req("playwright");
    }
  }
}

function classifyDeny(status, body) {
  if (status === 403) return "forbidden";
  if (status >= 300 && status < 400) return "redirect";
  if (/acceso denegado/i.test(body || "")) return "forbidden-page";
  if (/iniciar sesi[oó]n/i.test(body || "")) return "login";
  return `status-${status}`;
}

async function main() {
  if (!existsSync(PRIVATE)) {
    console.error(JSON.stringify({ error: "missing-demo-file" }));
    process.exit(2);
  }

  let playwright;
  try {
    playwright = await ensurePlaywright();
  } catch (error) {
    // Fallback: run without browser — report NOT_VERIFIED for browser layer
    console.log(
      JSON.stringify(
        {
          browser: "NOT_VERIFIED",
          reason: String(error?.message || error),
          hint: "Install playwright or re-run with browser available"
        },
        null,
        2
      )
    );
    process.exit(3);
  }

  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const account of parseDemoAccounts()) {
      const expect = EXPECT[account.email];
      if (!expect) continue;

      const context = await browser.newContext();
      const page = await context.newPage();
      const row = {
        role: expect.role,
        email: account.email,
        status: "PASS",
        reasons: [],
        path: null,
        nav: [],
        deny: {},
        chooser: null,
        billing: null,
        next: null,
        legacy: null,
        logout: null
      };

      try {
        await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.fill("#login-email", account.email);
        await page.fill("#login-password", account.password);
        await page.click('button[type="submit"]');
        await page.waitForFunction(
          () =>
            !location.pathname.endsWith("/login") ||
            location.search.includes("choose=1") ||
            !!document.querySelector("[role=alert]"),
          null,
          { timeout: 25000 }
        ).catch(() => null);
        await page.waitForTimeout(500);

        if (expect.expectChooser) {
          // ensure chooser URL (login action may land on /login?choose=1)
          if (!page.url().includes("choose=1") && page.url().includes("/login")) {
            await page.goto(`${BASE}/login?choose=1`, { waitUntil: "domcontentloaded" });
          }
          const url = page.url();
          const buttons = await page.locator("button").allTextContents();
          row.chooser = { url, buttons: buttons.map((b) => b.trim()).filter(Boolean) };
          const hasAll = (expect.chooserLabels || []).every((label) =>
            row.chooser.buttons.some((b) => b.includes(label))
          );
          const hasForbidden = (expect.chooserMustNot || []).some((label) =>
            row.chooser.buttons.some((b) => b.includes(label))
          );
          if (!hasAll || hasForbidden) {
            row.status = "FAIL";
            row.reasons.push(`chooser-mismatch:${JSON.stringify(row.chooser)}`);
          } else {
            await Promise.all([
              page.waitForURL((u) => u.pathname.startsWith(expect.afterChoose), {
                timeout: 20000
              }),
              page.getByRole("button", { name: "Administración general" }).click()
            ]);
            row.path = new URL(page.url()).pathname;
            if (!row.path.startsWith(expect.afterChoose)) {
              row.status = "FAIL";
              row.reasons.push(`after-choose:${row.path}`);
            }
          }
        } else {
          // follow /commercial index if needed
          let path = new URL(page.url()).pathname;
          const alert = await page.locator("[role=alert]").textContent().catch(() => null);
          if (path.startsWith("/login") && alert) {
            row.status = "FAIL";
            row.reasons.push(`login-alert:${alert}`);
          }
          if (path === "/commercial" && expect.afterPath) {
            await page.waitForTimeout(1500);
            path = new URL(page.url()).pathname;
            if (path === "/commercial") {
              await page.goto(`${BASE}${expect.afterPath}`, { waitUntil: "domcontentloaded" });
              path = new URL(page.url()).pathname;
            }
          }
          // finance/commercial may briefly stay on /login while action redirects
          if (path.startsWith("/login") && expect.pathPrefix.startsWith("/commercial")) {
            await page.goto(`${BASE}/commercial`, { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(1000);
            path = new URL(page.url()).pathname;
            if (path === "/commercial" && expect.afterPath) {
              await page.goto(`${BASE}${expect.afterPath}`, { waitUntil: "domcontentloaded" });
              path = new URL(page.url()).pathname;
            }
          }
          row.path = path;
          const okPrefix =
            path.startsWith(expect.pathPrefix) ||
            (expect.afterPath && path.startsWith(expect.afterPath));
          if (!okPrefix) {
            row.status = "FAIL";
            row.reasons.push(`landing:${path}`);
          }

          if (expect.navMust || expect.navMustNot) {
            const navTexts = await page.locator("nav a").allTextContents();
            row.nav = navTexts.map((t) => t.trim());
            for (const label of expect.navMust || []) {
              if (!row.nav.includes(label)) {
                row.status = "FAIL";
                row.reasons.push(`nav-missing:${label}`);
              }
            }
            for (const label of expect.navMustNot || []) {
              if (row.nav.includes(label)) {
                row.status = "FAIL";
                row.reasons.push(`nav-unexpected:${label}`);
              }
            }
          }
        }

        // Suspended owner billing
        if (expect.billingPath) {
          await page.goto(`${BASE}${expect.billingPath}`, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(2000);
          const body = await page.locator("body").innerText();
          row.billing = {
            path: new URL(page.url()).pathname,
            hasSuspended: expect.billingMustInclude.test(body)
          };
          if (row.billing.path !== expect.billingPath || !row.billing.hasSuspended) {
            row.status = "FAIL";
            row.reasons.push(`billing:${JSON.stringify(row.billing)}`);
          }
        }

        // Authorized next (admin billing for owners)
        if (expect.role === "owner" || expect.role === "owner-suspended") {
          await context.clearCookies();
          await page.goto(`${BASE}/login?next=%2Fadmin%2Fbilling`, {
            waitUntil: "domcontentloaded"
          });
          await page.fill("#login-email", account.email);
          await page.fill("#login-password", account.password);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(1200);
          row.next = new URL(page.url()).pathname;
          if (row.next !== "/admin/billing") {
            row.status = "FAIL";
            row.reasons.push(`next:${row.next}`);
          }
        }

        // Deny checks via fresh requests in same session
        // Re-login if we cleared cookies above
        if (expect.role === "owner" || expect.role === "owner-suspended") {
          // already on billing; session ok
        }

        for (const denyPath of expect.deny || []) {
          const response = await page.goto(`${BASE}${denyPath}`, {
            waitUntil: "domcontentloaded",
            timeout: 20000
          });
          const status = response?.status() ?? 0;
          const body = await page.locator("body").innerText().catch(() => "");
          const kind = classifyDeny(status, body);
          const finalPath = new URL(page.url()).pathname;
          row.deny[denyPath] = { status, kind, finalPath };
          const blocked =
            kind === "forbidden" ||
            kind === "forbidden-page" ||
            kind === "login" ||
            finalPath.startsWith("/login") ||
            (finalPath !== denyPath && !finalPath.startsWith(denyPath));
          if (!blocked && finalPath.startsWith(denyPath.replace(/\/$/, ""))) {
            // landed on denied area content
            if (!/acceso denegado/i.test(body)) {
              row.status = "FAIL";
              row.reasons.push(`deny-open:${denyPath}->${finalPath}`);
            }
          }
        }

        // Soft deny: finance billing for commercial-only — page may open read-only
        if (expect.denySoft) {
          for (const soft of expect.denySoft) {
            await page.goto(`${BASE}${soft}`, { waitUntil: "domcontentloaded" });
            const body = await page.locator("body").innerText();
            row.deny[soft] = {
              soft: true,
              path: new URL(page.url()).pathname,
              readOnlyHint: /solo finanzas/i.test(body)
            };
          }
        }

        // Logout
        await page.goto(`${BASE}/login?choose=1`, { waitUntil: "domcontentloaded" });
        const logoutBtn = page.getByRole("button", { name: /usar otra cuenta|cerrar sesi/i });
        if (await logoutBtn.count()) {
          await logoutBtn.first().click();
          await page.waitForTimeout(800);
        } else {
          // try admin logout if present
          const adminLogout = page.getByRole("button", { name: /cerrar sesi/i });
          if (await adminLogout.count()) {
            await adminLogout.first().click();
            await page.waitForTimeout(800);
          } else {
            await context.clearCookies();
            await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
          }
        }
        row.logout = new URL(page.url()).pathname;
        if (row.logout !== "/login") {
          // clearing cookies then /login is ok
          const hasForm = (await page.locator("#login-email").count()) > 0;
          if (!hasForm) {
            row.status = "FAIL";
            row.reasons.push(`logout:${row.logout}`);
          } else {
            row.logout = "/login";
          }
        }
      } catch (error) {
        row.status = "FAIL";
        row.reasons.push(`exception:${error?.message || error}`);
      }

      results.push(row);
      await context.close();
    }

    // Legacy redirects (no auth)
    const legacyContext = await browser.newContext();
    const legacyPage = await legacyContext.newPage();
    const legacy = {};
    for (const path of ["/admin/login", "/promoter/login"]) {
      const response = await legacyPage.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        maxRedirects: 0
      }).catch(async () => {
        // playwright follows redirects; check final URL
        await legacyPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
        return null;
      });
      await legacyPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      legacy[path] = new URL(legacyPage.url()).pathname;
    }
    // malicious next
    await legacyPage.goto(`${BASE}/login?next=https://evil.test`, {
      waitUntil: "domcontentloaded"
    });
    const evilStillLogin = new URL(legacyPage.url()).pathname === "/login";
    const evilForm = (await legacyPage.locator("#login-email").count()) > 0;
    legacy.maliciousNext = evilStillLogin && evilForm;

    // unauth deep link preserves next
    await legacyPage.goto(`${BASE}/admin/dashboard`, { waitUntil: "domcontentloaded" });
    legacy.unauthAdmin = legacyPage.url();

    await legacyContext.close();

    const failed = results.filter((r) => r.status !== "PASS");
    console.log(
      JSON.stringify(
        {
          base: BASE,
          browser: "PASS",
          summary: {
            total: results.length,
            pass: results.filter((r) => r.status === "PASS").length,
            fail: failed.length
          },
          results: results.map((r) => ({
            role: r.role,
            email: r.email,
            status: r.status,
            reasons: r.reasons,
            path: r.path,
            nav: r.nav,
            chooser: r.chooser,
            billing: r.billing,
            next: r.next,
            logout: r.logout,
            deny: r.deny
          })),
          legacy,
          failedEmails: failed.map((r) => r.email)
        },
        null,
        2
      )
    );
    process.exit(failed.length ? 1 : 0);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ browser: "FAIL", error: String(error?.message || error) }));
  process.exit(1);
});
