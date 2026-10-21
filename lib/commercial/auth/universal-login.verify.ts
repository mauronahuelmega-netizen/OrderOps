import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { areasFromAccessFacts } from "@/lib/auth/authorized-areas";
import { LOGIN_PATH, loginPathWith } from "@/lib/auth/login-path";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";
import {
  authorizeNextForAreas,
  isPathAuthorizedForAreas,
  sanitizeInternalNext
} from "@/lib/auth/safe-next";

// --- Single area ---
const adminOnly = areasFromAccessFacts({
  hasBusinessAdmin: true,
  isProfileSuperAdmin: false,
  commercialRoles: [],
  isPromoter: false
});
assert.deepEqual(
  adminOnly.map((a) => a.id),
  ["admin"]
);
assert.deepEqual(resolveLoginDestination({ areas: adminOnly }), {
  kind: "redirect",
  href: "/admin/dashboard"
});

const promoterOnly = areasFromAccessFacts({
  hasBusinessAdmin: false,
  isProfileSuperAdmin: false,
  commercialRoles: [],
  isPromoter: true
});
assert.deepEqual(resolveLoginDestination({ areas: promoterOnly }), {
  kind: "redirect",
  href: "/promoter"
});

const financeOnly = areasFromAccessFacts({
  hasBusinessAdmin: false,
  isProfileSuperAdmin: false,
  commercialRoles: ["finance"],
  isPromoter: false
});
assert.deepEqual(
  financeOnly.map((a) => a.id),
  ["finance"]
);
assert.equal(
  financeOnly.some((a) => a.id === "superadmin"),
  false,
  "finance must not receive superadmin"
);
assert.equal(
  financeOnly.some((a) => a.id === "commercial"),
  false,
  "finance-only must not receive commercial board"
);
assert.deepEqual(resolveLoginDestination({ areas: financeOnly }), {
  kind: "redirect",
  href: "/commercial/settlements"
});

// --- Multiple areas ---
const multi = areasFromAccessFacts({
  hasBusinessAdmin: true,
  isProfileSuperAdmin: false,
  commercialRoles: ["commercial", "finance"],
  isPromoter: true
});
assert.deepEqual(
  multi.map((a) => a.id).sort(),
  ["admin", "commercial", "finance", "promoter"]
);
assert.equal(resolveLoginDestination({ areas: multi }).kind, "choose");

// --- No areas ---
const none = areasFromAccessFacts({
  hasBusinessAdmin: false,
  isProfileSuperAdmin: false,
  commercialRoles: [],
  isPromoter: false
});
assert.deepEqual(resolveLoginDestination({ areas: none }), { kind: "none" });

// --- Valid next ---
assert.deepEqual(resolveLoginDestination({ areas: adminOnly, next: "/admin/billing" }), {
  kind: "redirect",
  href: "/admin/billing"
});
assert.deepEqual(resolveLoginDestination({ areas: financeOnly, next: "/commercial/billing" }), {
  kind: "redirect",
  href: "/commercial/billing"
});

// --- Malicious / external next ---
assert.equal(sanitizeInternalNext("https://evil.test/phish"), null);
assert.equal(sanitizeInternalNext("//evil.test"), null);
assert.equal(sanitizeInternalNext("/\\evil"), null);
assert.equal(sanitizeInternalNext("/login"), null);
assert.equal(sanitizeInternalNext("/admin/login"), null);
assert.equal(authorizeNextForAreas("https://evil.test", adminOnly), null);
assert.deepEqual(resolveLoginDestination({ areas: adminOnly, next: "https://evil.test" }), {
  kind: "redirect",
  href: "/admin/dashboard"
});

// --- Internal next without permission ---
assert.equal(authorizeNextForAreas("/super-admin", financeOnly), null);
assert.equal(authorizeNextForAreas("/admin/dashboard", financeOnly), null);
assert.equal(authorizeNextForAreas("/commercial/opportunities", financeOnly), null);
assert.equal(isPathAuthorizedForAreas("/commercial/opportunities", financeOnly), false);
assert.deepEqual(resolveLoginDestination({ areas: financeOnly, next: "/super-admin" }), {
  kind: "redirect",
  href: "/commercial/settlements"
});

// --- Superadmin isolation ---
const platformSuper = areasFromAccessFacts({
  hasBusinessAdmin: false,
  isProfileSuperAdmin: true,
  commercialRoles: ["superadmin"],
  isPromoter: false
});
assert.ok(platformSuper.some((a) => a.id === "superadmin"));
assert.ok(platformSuper.some((a) => a.id === "commercial"));
assert.equal(
  areasFromAccessFacts({
    hasBusinessAdmin: false,
    isProfileSuperAdmin: false,
    commercialRoles: ["superadmin"],
    isPromoter: false
  }).some((a) => a.id === "superadmin"),
  false,
  "commercial role superadmin alone must not open /super-admin shell"
);

// --- Path helpers ---
assert.equal(LOGIN_PATH, "/login");
assert.equal(loginPathWith({ error: "session", next: "/admin/billing" }), "/login?error=session&next=%2Fadmin%2Fbilling");
assert.equal(loginPathWith({ choose: true }), "/login?choose=1");

// --- Wiring: universal login + legacy redirects + logout ---
const loginPage = readFileSync("app/login/page.tsx", "utf8");
assert.equal(loginPage.includes("universalLoginAction"), true);
assert.equal(loginPage.includes("chooseAreaAction"), true);

const loginActions = readFileSync("app/login/actions.ts", "utf8");
assert.equal(loginActions.includes("signInWithPassword"), true);
assert.equal(loginActions.includes("listAuthorizedAreas"), true);
assert.equal(loginActions.includes("signOut"), true);
assert.equal(loginActions.includes(`redirect(LOGIN_PATH)`), true);

const adminLoginPage = readFileSync("app/admin/login/page.tsx", "utf8");
assert.equal(adminLoginPage.includes('redirect('), true);
assert.equal(adminLoginPage.includes("loginPathWith"), true);

const promoterLoginPage = readFileSync("app/promoter/login/page.tsx", "utf8");
assert.equal(promoterLoginPage.includes("loginPathWith"), true);

const adminLogout = readFileSync("app/admin/actions.ts", "utf8");
assert.equal(adminLogout.includes("universalLogoutAction"), true);

const middleware = readFileSync("middleware.ts", "utf8");
assert.equal(middleware.includes('"/login"'), true);
assert.equal(middleware.includes('"/super-admin"'), true);

const commercialGate = readFileSync("lib/commercial/auth/require-commercial-principal.ts", "utf8");
assert.equal(commercialGate.includes("buildLoginRedirect"), true);
assert.equal(commercialGate.includes('redirect("/admin/login")'), false);

const adminContext = readFileSync("lib/admin/context.ts", "utf8");
assert.equal(adminContext.includes("buildLoginRedirect"), true);

const superAdmin = readFileSync("lib/super-admin/context.ts", "utf8");
assert.equal(superAdmin.includes("buildLoginRedirect"), true);
assert.equal(superAdmin.includes("forbidden()"), true);

const listAreas = readFileSync("lib/auth/list-authorized-areas.ts", "utf8");
assert.equal(listAreas.includes("requireAdminContext"), false);
assert.equal(listAreas.includes("forbidden()"), false);
assert.equal(listAreas.includes('from "next/navigation"'), false);
assert.equal(listAreas.includes("commercial_session"), true);
assert.equal(listAreas.includes("promoter_session"), true);

console.log("universal-login.verify: ok");
