/**
 * Pure authorization checks. No database and no service role.
 * Run: npx tsx lib/commercial/auth/authorization.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getAdminPermissions, hasAdminPermission, type AdminPermission } from "@/lib/admin/permissions";
import { buildCommercialPrincipal, principalHasPermission } from "@/lib/commercial/auth/principal";
import {
  commercialPermissions,
  hasCommercialPermission,
  paymentRecordingAllowed,
  rolesGranting,
  settlementApprovalAllowed,
  type InternalRole
} from "@/lib/commercial/auth/permissions";

const adminKeys = [
  "viewOrders",
  "updateOrders",
  "manageNotifications",
  "manageTeam",
  "manageProducts",
  "managePublicSettings"
] as const satisfies readonly AdminPermission[];

assert.equal(adminKeys.length, 6);
assert.equal(hasAdminPermission("owner", "viewOrders"), true);
assert.equal(hasAdminPermission("owner", "updateOrders"), true);
assert.equal(hasAdminPermission("owner", "manageNotifications"), true);
assert.equal(hasAdminPermission("owner", "manageTeam"), true);
assert.equal(hasAdminPermission("owner", "manageProducts"), true);
assert.equal(hasAdminPermission("owner", "managePublicSettings"), true);
assert.equal(hasAdminPermission("viewer", "updateOrders"), false);
assert.equal(hasAdminPermission("viewer", "manageProducts"), false);
assert.equal(hasAdminPermission("operator", "manageNotifications"), true);
assert.equal(hasAdminPermission("operator", "manageTeam"), false);
assert.equal(hasAdminPermission("manager", "manageTeam"), false);
assert.deepEqual(Object.keys(getAdminPermissions("owner")).sort(), [
  "canManageNotifications",
  "canManageProducts",
  "canManagePublicSettings",
  "canManageTeam",
  "canUpdateOrders",
  "canViewOrders"
]);

assert.equal(hasCommercialPermission(["support"], "settlement.approve"), false);
assert.equal(hasCommercialPermission(["finance"], "opportunity.win"), false);
assert.equal(hasCommercialPermission(["superadmin"], "collection.write"), false);
assert.equal(hasCommercialPermission(["superadmin"], "settlement.prepare"), false);
assert.equal(hasCommercialPermission(["superadmin"], "payment.record"), false);
assert.equal(hasCommercialPermission(["finance"], "collection.write"), true);
assert.equal(hasCommercialPermission(["commercial", "support"], "crm.write"), true);
assert.equal(hasCommercialPermission(["commercial", "support"], "onboarding.manage"), true);
assert.equal(hasCommercialPermission(["finance", "superadmin"], "opportunity.win"), true);
assert.equal(hasCommercialPermission(["finance", "superadmin"], "collection.write"), true);

const combined: readonly InternalRole[] = ["finance", "superadmin"];
const sameActor = settlementApprovalAllowed({
  preparerAccountId: "acct-1",
  approverAccountId: "acct-1",
  approverRoles: combined,
  sodException: false
});
assert.equal(sameActor.allowed, false);
assert.equal(sameActor.commercialErrorCode, "sod_violation");

const distinctActors = settlementApprovalAllowed({
  preparerAccountId: "acct-1",
  approverAccountId: "acct-2",
  approverRoles: combined,
  sodException: false
});
assert.equal(distinctActors.allowed, true);

const breakGlass = settlementApprovalAllowed({
  preparerAccountId: "acct-1",
  approverAccountId: "acct-1",
  approverRoles: combined,
  sodException: true
});
assert.equal(breakGlass.allowed, true);

const financeSelfApprove = settlementApprovalAllowed({
  preparerAccountId: "acct-1",
  approverAccountId: "acct-1",
  approverRoles: ["finance"],
  sodException: true
});
assert.equal(financeSelfApprove.commercialErrorCode, "sod_violation");

const supportApprove = settlementApprovalAllowed({
  preparerAccountId: "acct-1",
  approverAccountId: "acct-2",
  approverRoles: ["support"],
  sodException: false
});
assert.equal(supportApprove.commercialErrorCode, "forbidden");

const selfPay = paymentRecordingAllowed({
  approverAccountId: "acct-2",
  recorderAccountId: "acct-2",
  recorderRoles: combined,
  sodException: false
});
assert.equal(selfPay.commercialErrorCode, "sod_violation");

const superadminPay = paymentRecordingAllowed({
  approverAccountId: "acct-1",
  recorderAccountId: "acct-2",
  recorderRoles: ["superadmin"],
  sodException: true
});
assert.equal(superadminPay.commercialErrorCode, "forbidden");

const disabled = buildCommercialPrincipal({
  accountId: "acct-1",
  userId: "user-1",
  kind: "internal",
  roles: ["superadmin"],
  disabledAt: "2026-10-08T00:00:00.000Z"
});
assert.equal(principalHasPermission(disabled, "opportunity.win"), false);

const promoter = buildCommercialPrincipal({
  accountId: "acct-2",
  userId: "user-2",
  kind: "promoter",
  roles: ["superadmin", "finance"],
  disabledAt: null
});
assert.deepEqual(promoter.roles, []);
assert.equal(principalHasPermission(promoter, "crm.read"), false);

const sql = readFileSync("supabase/migrations/20261008215314_commercial_phase01_foundations.sql", "utf8");
const caseStart = sql.indexOf("return case p_code");
const caseEnd = sql.indexOf("else false", caseStart);
assert.ok(caseStart > 0 && caseEnd > caseStart);
const sqlCase = sql.slice(caseStart, caseEnd);
for (const code of commercialPermissions()) {
  const match = sqlCase.match(new RegExp(`when '${code}' then v_roles && array\\[([^\\]]+)\\]`));
  assert.ok(match, `SQL grant missing for ${code}`);
  const sqlRoles = match[1].split(",").map((role) => role.trim().replaceAll("'", ""));
  assert.deepEqual(sqlRoles, [...rolesGranting(code)]);
}
