/**
 * Disposable QA: sign in demo accounts via Supabase Auth and resolve areas
 * with the same pure helpers used by /login. Does not rotate passwords.
 * Passwords are read from ORDEROPS_DEMO_ACCESS.private.md (gitignored).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { areasFromAccessFacts } from "../../lib/auth/authorized-areas.ts";
import { resolveLoginDestination } from "../../lib/auth/resolve-login-destination.ts";
import { authorizeNextForAreas, sanitizeInternalNext } from "../../lib/auth/safe-next.ts";

function loadEnvLocal() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const env = { ...process.env };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function parseDemoAccounts() {
  const text = readFileSync(resolve(process.cwd(), "ORDEROPS_DEMO_ACCESS.private.md"), "utf8");
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
  "demo.valentina@local.test": { ids: ["admin"], href: "/admin/dashboard" },
  "demo.sofia@local.test": { ids: ["admin"], href: "/admin/dashboard" },
  "demo.diego@local.test": { ids: ["admin"], href: "/admin/dashboard" },
  "demo.camila@local.test": { ids: ["admin"], href: "/admin/dashboard" },
  "demo.lucia@local.test": {
    ids: ["commercial"],
    href: "/commercial",
    commercialScopes: ["board"]
  },
  "demo.nicolas@local.test": {
    ids: ["commercial"],
    href: "/commercial",
    commercialScopes: ["finance"]
  },
  "demo.tomas@local.test": { ids: ["promoter"], href: "/promoter" },
  "demo.martin@local.test": { ids: ["commercial", "superadmin"], href: "choose-or-super" }
};

const env = loadEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const rows = [];
for (const account of parseDemoAccounts()) {
  const expected = EXPECT[account.email];
  if (!expected) continue;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password
  });

  if (error || !data.user) {
    rows.push({ email: account.email, status: "FAIL", reason: error?.message ?? "no-user" });
    continue;
  }

  const userId = data.user.id;
  const [{ data: profile }, commercialResult, promoterResult] = await Promise.all([
    supabase.from("profiles").select("business_id, role").eq("id", userId).maybeSingle(),
    supabase.rpc("commercial_session"),
    supabase.rpc("promoter_session")
  ]);

  const commercialSession = commercialResult.data ?? null;
  const commercialRoles =
    commercialSession?.ok === true &&
    commercialSession.kind === "internal" &&
    Array.isArray(commercialSession.roles)
      ? commercialSession.roles
      : [];
  const promoterSession = promoterResult.data ?? null;

  const areas = areasFromAccessFacts({
    hasBusinessAdmin: Boolean(profile?.business_id),
    isProfileSuperAdmin: profile?.role === "super_admin",
    commercialRoles,
    isPromoter: promoterSession?.ok === true
  });

  const destination = resolveLoginDestination({ areas });
  const ids = areas.map((a) => a.id).sort();
  const financeGetsSuper = account.email.includes("nicolas") && ids.includes("superadmin");

  let status = "PASS";
  let reason = "";
  if (financeGetsSuper) {
    status = "FAIL";
    reason = "finance-got-superadmin";
  } else if (expected.href === "choose-or-super") {
    if (!(ids.includes("superadmin") || destination.kind === "choose" || destination.href === "/super-admin")) {
      status = "FAIL";
      reason = `unexpected-superadmin-resolution:${destination.kind}:${destination.href ?? ids.join(",")}`;
    }
  } else if (destination.kind !== "redirect" || destination.href !== expected.href) {
    status = "FAIL";
    reason = `dest=${destination.kind}:${destination.href ?? "-"} expected=${expected.href}`;
  } else if (JSON.stringify(ids) !== JSON.stringify([...expected.ids].sort())) {
    status = "FAIL";
    reason = `ids=${ids.join(",")} expected=${expected.ids.join(",")}`;
  }

  if (status === "PASS" && expected.commercialScopes) {
    const commercial = areas.find((area) => area.id === "commercial");
    const scopes = [...(commercial?.commercialScopes ?? [])].sort();
    const expectedScopes = [...expected.commercialScopes].sort();
    if (JSON.stringify(scopes) !== JSON.stringify(expectedScopes)) {
      status = "FAIL";
      reason = `scopes=${scopes.join(",")} expected=${expectedScopes.join(",")}`;
    }
  }

  // next authorization smoke for finance-only workspace
  if (account.email.includes("nicolas")) {
    const badSuper = authorizeNextForAreas("/super-admin", areas);
    const badBoard = authorizeNextForAreas("/commercial/opportunities", areas);
    const good = authorizeNextForAreas("/commercial/billing", areas);
    if (badSuper !== null || badBoard !== null || good !== "/commercial/billing") {
      status = "FAIL";
      reason = `next-authz badSuper=${badSuper} badBoard=${badBoard} good=${good}`;
    }
  }

  rows.push({
    email: account.email,
    profile: account.profile,
    status,
    reason,
    ids,
    destination
  });

  await supabase.auth.signOut();
}

// Legacy redirect + safe next unit checks (no secrets)
const legacyChecks = {
  sanitizeExternal: sanitizeInternalNext("https://evil.test") === null,
  sanitizeProto: sanitizeInternalNext("//evil") === null,
  sanitizeLogin: sanitizeInternalNext("/admin/login") === null
};

console.log(JSON.stringify({ rows, legacyChecks }, null, 2));
const failed = rows.filter((r) => r.status !== "PASS");
process.exit(failed.length === 0 && Object.values(legacyChecks).every(Boolean) ? 0 : 1);
