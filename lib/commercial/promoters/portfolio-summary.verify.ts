import assert from "node:assert/strict";
import {
  buildPortfolio,
  groupOpenTasks,
  labelClaimStatus,
  labelPromoterStatus,
  labelSettlementStatus,
  summarizeSettlementStatuses,
  taskBucket
} from "@/lib/commercial/promoters/portfolio-summary";

const now = new Date(2026, 9, 17, 15, 0, 0);

const portfolio = buildPortfolio({
  businesses: [
    { id: "negocio-a", display_name: "Negocio A" },
    { id: "negocio-b", display_name: "  " }
  ],
  opportunities: [
    { stage: "qualified", business_id: "negocio-a" },
    { stage: "qualified", business_id: "negocio-a" },
    { stage: "contacting", business_id: "negocio-b" }
  ],
  claims: [
    { status: "confirmed", business_id: "negocio-a" },
    { status: "provisional", business_id: "negocio-b" }
  ]
});

assert.equal(portfolio.length, 2);
assert.deepEqual(portfolio[0], {
  id: "negocio-a",
  displayName: "Negocio A",
  stages: ["qualified"],
  claimStatuses: ["confirmed"]
});
assert.equal(portfolio[1].displayName, "Comercio sin nombre");
assert.deepEqual(portfolio[1].stages, ["contacting"]);
assert.deepEqual(portfolio[1].claimStatuses, ["provisional"]);
assert.equal(portfolio[0].claimStatuses.includes("provisional"), false);

assert.equal(taskBucket({ status: "open", due_at: new Date(2026, 9, 17, 18, 0, 0).toISOString() }, now), "today");
assert.equal(taskBucket({ status: "open", due_at: new Date(2026, 9, 18, 10, 0, 0).toISOString() }, now), "upcoming");
assert.equal(taskBucket({ status: "open", due_at: new Date(2026, 9, 16, 10, 0, 0).toISOString() }, now), "overdue");
assert.equal(taskBucket({ status: "done", due_at: new Date(2026, 9, 17, 10, 0, 0).toISOString() }, now), "other");

const groups = groupOpenTasks(
  [
    { title: "hoy", status: "open", due_at: new Date(2026, 9, 17, 18, 0, 0).toISOString() },
    { title: "hecha", status: "done", due_at: new Date(2026, 9, 17, 9, 0, 0).toISOString() }
  ],
  now
);
assert.equal(groups.today.length, 1);
assert.equal(groups.overdue.length, 0);
assert.equal(groups.upcoming.length, 0);

const settlements = summarizeSettlementStatuses([
  { status: "paid", total_cents: 2200000 },
  { status: "approved", total_cents: 12000000 },
  { status: "approved", total_cents: 100 }
]);
assert.deepEqual(settlements, [
  { status: "approved", count: 2, totalCents: 12000100 },
  { status: "paid", count: 1, totalCents: 2200000 }
]);

assert.equal(labelPromoterStatus("active"), "Activo");
assert.equal(labelClaimStatus("confirmed"), "Confirmada");
assert.equal(labelSettlementStatus("reconciliation_required"), "Conciliación manual");
assert.equal(labelSettlementStatus("custom_status"), "custom_status");

console.log("portfolio-summary.verify: ok");
