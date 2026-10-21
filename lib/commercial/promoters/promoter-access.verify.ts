import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LOGIN_PATH } from "@/lib/auth/login-path";
import {
  classifyAuthFailure,
  decidePromoterAccess,
  PROMOTER_HOME_PATH,
  PROMOTER_LOGIN_PATH,
  safePromoterNext
} from "./promoter-access";

assert.equal(classifyAuthFailure({ status: 400, message: "Invalid login credentials" }), "invalid_credentials");
assert.equal(classifyAuthFailure({ status: 0, message: "fetch failed" }), "auth_unavailable");
assert.equal(classifyAuthFailure({ message: "fetch failed" }), "auth_unavailable");

assert.equal(decidePromoterAccess({ hasUser: false, sessionOk: null }), "login");
assert.equal(decidePromoterAccess({ hasUser: true, sessionOk: true }), "allow");
assert.equal(decidePromoterAccess({ hasUser: true, sessionOk: false }), "forbidden");
assert.equal(decidePromoterAccess({ hasUser: true, sessionOk: null }), "forbidden");
assert.equal(safePromoterNext("/promoter/tasks"), "/promoter/tasks");
assert.equal(safePromoterNext("/promoter/tasks?q=1"), "/promoter/tasks");
assert.equal(safePromoterNext("/promoter/login"), PROMOTER_HOME_PATH);
assert.equal(safePromoterNext("https://example.test/promoter"), PROMOTER_HOME_PATH);
assert.equal(safePromoterNext("//promoter/tasks"), PROMOTER_HOME_PATH);
assert.equal(safePromoterNext("/admin/dashboard"), PROMOTER_HOME_PATH);

const gate = readFileSync("lib/commercial/promoters/require-promoter-principal.ts", "utf8");
assert.equal(gate.includes('redirect("/admin/login")'), false);
assert.equal(gate.includes("buildLoginRedirect"), true);
assert.equal(gate.includes("profiles"), false);
assert.equal(gate.includes("forbidden"), true);

const login = readFileSync("app/promoter/login/actions.ts", "utf8");
assert.equal(login.includes("universalLoginAction"), true);
assert.equal(login.includes("universalLogoutAction"), true);

const adminLogin = readFileSync("app/admin/login/actions.ts", "utf8");
assert.equal(adminLogin.includes("universalLoginAction"), true);

const adminLogout = readFileSync("app/admin/actions.ts", "utf8");
assert.equal(adminLogout.includes("universalLogoutAction"), true);

const middleware = readFileSync("middleware.ts", "utf8");
assert.equal(middleware.includes('"/promoter"'), true);
assert.equal(middleware.includes('"/promoter/:path*"'), true);
assert.equal(middleware.includes('"/admin/:path*"'), true);
assert.equal(middleware.includes('"/login"'), true);

const panel = readFileSync("app/promoter/(panel)/layout.tsx", "utf8");
assert.equal(panel.includes("requirePromoterPrincipal"), true);
assert.equal(panel.includes("PromoterShell"), true);
const shell = readFileSync("components/promoter/promoter-shell.tsx", "utf8");
assert.equal(shell.includes("promoterLogoutAction"), true);

assert.equal(PROMOTER_LOGIN_PATH, LOGIN_PATH);
assert.equal(PROMOTER_LOGIN_PATH, "/login");
assert.equal(PROMOTER_HOME_PATH, "/promoter");

const legacyPromoterPage = readFileSync("app/promoter/login/page.tsx", "utf8");
assert.equal(legacyPromoterPage.includes("loginPathWith"), true);

console.log("promoter-access.verify: ok");
