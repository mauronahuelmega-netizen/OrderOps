import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  classifyAuthFailure,
  decidePromoterAccess,
  PROMOTER_HOME_PATH,
  PROMOTER_LOGIN_PATH
} from "./promoter-access";

assert.equal(classifyAuthFailure({ status: 400, message: "Invalid login credentials" }), "invalid_credentials");
assert.equal(classifyAuthFailure({ status: 0, message: "fetch failed" }), "auth_unavailable");
assert.equal(classifyAuthFailure({ message: "fetch failed" }), "auth_unavailable");

assert.equal(decidePromoterAccess({ hasUser: false, sessionOk: null }), "login");
assert.equal(decidePromoterAccess({ hasUser: true, sessionOk: true }), "allow");
assert.equal(decidePromoterAccess({ hasUser: true, sessionOk: false }), "forbidden");
assert.equal(decidePromoterAccess({ hasUser: true, sessionOk: null }), "forbidden");

const gate = readFileSync("lib/commercial/promoters/require-promoter-principal.ts", "utf8");
assert.equal(gate.includes('redirect("/admin/login")'), false);
assert.equal(gate.includes("PROMOTER_LOGIN_PATH"), true);
assert.equal(gate.includes("profiles"), false);
assert.equal(gate.includes("forbidden"), true);

const login = readFileSync("app/promoter/login/actions.ts", "utf8");
assert.equal(login.includes("classifyAuthFailure"), true);
assert.equal(login.includes("signInWithPassword"), true);
assert.equal(login.includes("promoter_session"), true);
assert.equal(login.includes("searchParams"), false);
assert.equal(login.includes(`redirect(PROMOTER_HOME_PATH)`), true);
assert.equal(login.includes("signOut"), true);
assert.equal(login.includes(`redirect(PROMOTER_LOGIN_PATH)`), true);

const adminLogin = readFileSync("app/admin/login/actions.ts", "utf8");
assert.equal(adminLogin.includes('redirect("/admin/dashboard")'), true);
assert.equal(adminLogin.includes('redirect("/admin/login?error=missing_credentials")'), true);
assert.equal(adminLogin.includes("/promoter"), false);

const adminLogout = readFileSync("app/admin/actions.ts", "utf8");
assert.equal(adminLogout.includes('redirect("/admin/login")'), true);

const middleware = readFileSync("middleware.ts", "utf8");
assert.equal(middleware.includes('"/promoter"'), true);
assert.equal(middleware.includes('"/promoter/:path*"'), true);
assert.equal(middleware.includes('"/admin/:path*"'), true);

const panel = readFileSync("app/promoter/(panel)/layout.tsx", "utf8");
assert.equal(panel.includes("requirePromoterPrincipal"), true);
assert.equal(panel.includes("promoterLogoutAction"), true);

assert.equal(PROMOTER_LOGIN_PATH, "/promoter/login");
assert.equal(PROMOTER_HOME_PATH, "/promoter");

console.log("promoter-access.verify: ok");
