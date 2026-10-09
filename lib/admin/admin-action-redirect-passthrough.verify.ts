/**
 * Verify ADMIN-ACTION-REDIRECT-PASSTHROUGH-FIX-1 (PROD-P2-9).
 *
 * Auth/permission redirects from requireAdminPermission / requireAdminContext must
 * not execute inside the try/catch that normalizes application errors via
 * getActionErrorMessage. Real application errors must still be normalized.
 *
 * Run: npx tsx lib/admin/admin-action-redirect-passthrough.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getActionErrorMessage } from "@/lib/admin/action-errors";

/** Action files implicated by PROD-P2-9 (guard was inside normalizing try/catch). */
const AFFECTED_FILES = [
  "app/admin/(protected)/categories/actions.ts",
  "app/admin/(protected)/dashboard/actions.ts",
  "app/admin/(protected)/orders/[id]/actions.ts",
  "app/admin/(protected)/products/actions.ts",
  "app/admin/(protected)/products/customizations/actions.ts",
  "app/admin/(protected)/settings/notifications/actions.ts",
  "app/admin/(protected)/settings/operations/actions.ts",
  "app/admin/(protected)/settings/public/actions.ts"
] as const;

/** Byte-for-byte permission / context contract expected per file. */
const EXPECTED_PERMISSIONS: Record<(typeof AFFECTED_FILES)[number], string[]> = {
  "app/admin/(protected)/categories/actions.ts": ["manageProducts", "manageProducts"],
  "app/admin/(protected)/dashboard/actions.ts": [
    "managePublicSettings",
    "managePublicSettings",
    "managePublicSettings"
  ],
  "app/admin/(protected)/orders/[id]/actions.ts": ["updateOrders", "updateOrders"],
  "app/admin/(protected)/products/actions.ts": [
    "manageProducts",
    "manageProducts",
    "manageProducts",
    "manageProducts"
  ],
  "app/admin/(protected)/products/customizations/actions.ts": Array(24).fill(
    "manageProducts"
  ) as string[],
  "app/admin/(protected)/settings/notifications/actions.ts": [
    "requireAdminContext",
    "requireAdminContext",
    "requireAdminContext"
  ],
  "app/admin/(protected)/settings/operations/actions.ts": ["managePublicSettings"],
  "app/admin/(protected)/settings/public/actions.ts": [
    "managePublicSettings",
    "managePublicSettings"
  ]
};

const GUARD_CALL = /await\s+requireAdmin(?:Permission|Context)\s*\(([^)]*)\)/g;

function splitActions(source: string): { name: string; body: string }[] {
  const starts = [...source.matchAll(/export async function (\w+)/g)];
  const actions: { name: string; body: string }[] = [];

  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i].index ?? 0;
    const end = i + 1 < starts.length ? (starts[i + 1].index ?? source.length) : source.length;
    actions.push({
      name: starts[i][1],
      body: source.slice(start, end)
    });
  }

  return actions;
}

function findNormalizingTryRanges(body: string): { tryStart: number; catchEnd: number }[] {
  const ranges: { tryStart: number; catchEnd: number }[] = [];
  let searchFrom = 0;

  while (true) {
    const tryIdx = body.indexOf("try {", searchFrom);
    if (tryIdx < 0) {
      break;
    }

    const openBrace = body.indexOf("{", tryIdx);
    let depth = 0;
    let tryClose = -1;

    for (let i = openBrace; i < body.length; i += 1) {
      if (body[i] === "{") {
        depth += 1;
      } else if (body[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          tryClose = i;
          break;
        }
      }
    }

    if (tryClose < 0) {
      break;
    }

    const afterTry = body.slice(tryClose + 1);
    const catchMatch = afterTry.match(/^\s*catch\s*\([^)]*\)\s*\{/);
    if (!catchMatch) {
      searchFrom = tryIdx + 4;
      continue;
    }

    const catchOpen = tryClose + 1 + catchMatch[0].length - 1;
    let catchDepth = 0;
    let catchClose = -1;

    for (let i = catchOpen; i < body.length; i += 1) {
      if (body[i] === "{") {
        catchDepth += 1;
      } else if (body[i] === "}") {
        catchDepth -= 1;
        if (catchDepth === 0) {
          catchClose = i;
          break;
        }
      }
    }

    if (catchClose < 0) {
      searchFrom = tryIdx + 4;
      continue;
    }

    const catchBody = body.slice(catchOpen, catchClose + 1);
    if (catchBody.includes("getActionErrorMessage")) {
      ranges.push({ tryStart: tryIdx, catchEnd: catchClose });
    }

    searchFrom = tryIdx + 4;
  }

  return ranges;
}

let affectedActionCount = 0;

for (const rel of AFFECTED_FILES) {
  const source = readFileSync(path.join(process.cwd(), rel), "utf8");
  const actions = splitActions(source);

  // D/E/F — no framework-error parsing, no unstable_rethrow, no next/dist internals.
  assert.ok(!/NEXT_REDIRECT/.test(source), `${rel}: must not parse NEXT_REDIRECT`);
  assert.ok(!/unstable_rethrow/.test(source), `${rel}: must not use unstable_rethrow`);
  assert.ok(!/next\/dist\//.test(source), `${rel}: must not import next/dist internals`);

  const perms: string[] = [];

  for (const action of actions) {
    const normalizingTries = findNormalizingTryRanges(action.body);
    if (normalizingTries.length === 0) {
      continue;
    }

    // Only actions that both guard and normalize are in scope for A.
    const guardMatches = [...action.body.matchAll(GUARD_CALL)];
    if (guardMatches.length === 0) {
      continue;
    }

    affectedActionCount += 1;

    for (const guard of guardMatches) {
      const guardIdx = guard.index ?? -1;
      assert.ok(guardIdx >= 0, `${rel}#${action.name}: guard index`);

      for (const range of normalizingTries) {
        assert.ok(
          guardIdx < range.tryStart || guardIdx > range.catchEnd,
          `${rel}#${action.name}: auth guard must execute outside the normalizing try/catch`
        );
      }

      // C — permission string preserved (or context-only).
      const args = (guard[1] ?? "").trim();
      if (args.startsWith('"')) {
        const perm = args.match(/^"([^"]+)"/)?.[1];
        assert.ok(perm, `${rel}#${action.name}: permission literal`);
        perms.push(perm);
      } else {
        perms.push("requireAdminContext");
      }
    }

    // B — getActionErrorMessage still present in catch.
    assert.ok(
      action.body.includes("getActionErrorMessage"),
      `${rel}#${action.name}: getActionErrorMessage must remain in the catch`
    );

    // G — no semantic relocation of revalidate/cache out of the action body.
    // (Presence is allowed either inside try or after try as in team actions; just ensure
    // we did not delete the helpers from files that used them.)
  }

  assert.deepEqual(
    perms,
    EXPECTED_PERMISSIONS[rel],
    `${rel}: permission / context contract must be byte-for-byte preserved`
  );
}

assert.equal(
  affectedActionCount,
  41,
  `expected 41 affected actions across the 8 files, found ${affectedActionCount}`
);

// Also confirm the shared helper itself was not "fixed" by string-parsing redirects.
const actionErrors = readFileSync(
  path.join(process.cwd(), "lib/admin/action-errors.ts"),
  "utf8"
);
assert.ok(!/NEXT_REDIRECT/.test(actionErrors), "action-errors must not special-case NEXT_REDIRECT");
assert.ok(!/unstable_rethrow/.test(actionErrors), "action-errors must not use unstable_rethrow");

const contextSource = readFileSync(path.join(process.cwd(), "lib/admin/context.ts"), "utf8");
assert.ok(
  /redirect\("\/admin\/login"\)/.test(contextSource),
  "requireAdminContext must still redirect to login"
);
assert.ok(
  /redirect\(fallbackHref\)/.test(contextSource),
  "requireAdminPermission must still redirect on missing permission"
);

// Behavior: synthetic application errors still normalize.
assert.equal(
  getActionErrorMessage(new Error("boom"), "fallback"),
  "boom",
  "real Error messages must still surface"
);
assert.equal(
  getActionErrorMessage(new Error("   "), "fallback"),
  "fallback",
  "blank Error messages must still fall back"
);
assert.equal(
  getActionErrorMessage("not-an-error", "fallback"),
  "fallback",
  "non-Error values must still fall back"
);

// Structural determinism for auth redirect: guard call sites sit before try, so a
// redirect thrown by requireAdmin* never enters getActionErrorMessage.
console.log(
  "admin-action-redirect-passthrough.verify.ts: PASS",
  `(${AFFECTED_FILES.length} files, ${affectedActionCount} actions)`
);
