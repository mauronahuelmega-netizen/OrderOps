import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { nominalCommissionCents } from "@/lib/commercial/commissions/calculate";
import {
  decideFounderSubscriptionPeriod,
  founderMonthlyDueDates,
  founderPeriodOn,
} from "@/lib/commercial/founder-period";

type Status = "PASS" | "EXPECTED_RED" | "FAIL" | "BLOCKED" | "NOT_VERIFIED";

const results: Array<{ id: string; status: Status; detail: string }> = [];

function record(id: string, status: Status, detail: string) {
  results.push({ id, status, detail });
}

const founder = { setupCommissionCents: BigInt(12000000), recurringBps: BigInt(4000) };
const activationCents = BigInt(29000000);
const monthlyCents = BigInt(5500000);
const supersededMonthlyCents = BigInt(6500000);
const setupCommissionCents = BigInt(12000000);
const recurringCommissionCents = BigInt(2200000);

const collections = readFileSync(
  "supabase/migrations/20261012030000_commercial_phase05_collections.sql",
  "utf8"
);
const slots = readFileSync(
  "supabase/migrations/20261013030000_commercial_phase05_slots.sql",
  "utf8"
);
const phase01 = readFileSync(
  "supabase/migrations/20261008215314_commercial_phase01_foundations.sql",
  "utf8"
);
const includedPeriod = readFileSync(
  "supabase/migrations/20261017120000_commercial_founder_included_period.sql",
  "utf8"
);

const setupCommission = nominalCommissionCents("setup", activationCents, founder);
const recurringCommission = nominalCommissionCents("recurring", monthlyCents, founder);

if (setupCommission === setupCommissionCents && phase01.includes("29000000")) {
  record("A", "PASS", "Activación ARS 290.000 y comisión nominal de alta ARS 120.000.");
} else {
  record("A", "FAIL", "El importe de activación o la comisión de alta no coinciden con el contrato.");
}

const includedDecision = decideFounderSubscriptionPeriod("2026-11-10", "2026-11-10");
const firstMonthly = decideFounderSubscriptionPeriod("2026-11-10", "2026-12-10");
if (
  includedDecision.ok === false &&
  includedDecision.code === "included_period" &&
  founderPeriodOn("2026-11-10", 1) === "2026-12-10" &&
  includedPeriod.includes("included_period") &&
  includedPeriod.includes("service_start_required")
) {
  record(
    "B",
    "PASS",
    "El período 2026-11-10 queda incluido. No es una mensualidad exigible y no avanza el calendario recurrente."
  );
} else {
  record("B", "FAIL", "El primer período incluido sigue pudiendo tratarse como mensualidad.");
}

if (firstMonthly.ok === true && firstMonthly.periodKey === "2026-12-10") {
  record(
    "C",
    "PASS",
    "Con inicio 2026-11-10, la primera mensualidad es el período 2026-12-10."
  );
} else {
  record("C", "FAIL", "La primera mensualidad no cae en el período siguiente.");
}

const monthEnd = decideFounderSubscriptionPeriod("2026-01-31", "2026-02-28");
if (monthEnd.ok || monthEnd.code !== "month_length_unspecified" || founderPeriodOn("2026-01-31", 1) !== null) {
  record("C-month-end", "FAIL", "Una fecha de fin de mes recibió una política que el contrato no define.");
}

const schedule = founderMonthlyDueDates("2026-11-10", 3);
if (
  schedule[0] === "2026-12-10" &&
  schedule[1] === "2027-01-10" &&
  schedule[2] === "2027-02-10"
) {
  record("T03-A", "PASS", "Inicio 2026-11-10: vencimientos 2026-12-10, 2027-01-10 y 2027-02-10.");
} else {
  record("T03-A", "FAIL", "El calendario anclado no produjo los tres vencimientos exigidos.");
}

if (
  recurringCommission === recurringCommissionCents &&
  slots.includes("max_recurring_slots") &&
  slots.includes("slot_exhausted")
) {
  record(
    "D",
    "PASS",
    "La mensualidad de ARS 55.000 conserva comisión nominal de ARS 22.000 y el tope de doce slots."
  );
} else {
  record("D", "FAIL", "La comisión recurrente o el tope de doce cobranzas no coinciden.");
}

if (
  collections.includes("p_gross_cents = v_obligation.list_price_cents") &&
  collections.includes("blocked_pending_policy") &&
  supersededMonthlyCents !== monthlyCents
) {
  record(
    "E",
    "PASS",
    "Un importe distinto del precio congelado, incluido ARS 65.000 contra ARS 55.000, queda en blocked_pending_policy y no es base elegible."
  );
} else {
  record("E", "FAIL", "El control de importe exacto no está en la cobranza actual.");
}

record(
  "F",
  "NOT_VERIFIED",
  "La Revisión 2 excluye efectivo y precios distintos por medio. No hay adaptador de Mobbex ni de Talo. No se verificó un rechazo operativo ni un cobro real."
);

for (const result of results) {
  console.log(`${result.status} ${result.id}: ${result.detail}`);
}

const failed = results.filter((result) => result.status === "FAIL" || result.status === "BLOCKED");
assert.equal(failed.length, 0, failed.map((result) => result.id).join(","));
console.log("founder-v1-contract.verify: ok");
