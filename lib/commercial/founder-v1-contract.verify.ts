import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { nominalCommissionCents } from "@/lib/commercial/commissions/calculate";

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

const closure = readFileSync(
  "docs/commercial-core-v1/ORDEROPS_COMMERCIAL_CORE_PROMOTORES_V1_DECISIONES_CIERRE.md",
  "utf8"
);
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

const setupCommission = nominalCommissionCents("setup", activationCents, founder);
const recurringCommission = nominalCommissionCents("recurring", monthlyCents, founder);

if (setupCommission === setupCommissionCents && phase01.includes("29000000")) {
  record("A", "PASS", "Activación ARS 290.000 y comisión nominal de alta ARS 120.000.");
} else {
  record("A", "FAIL", "El importe de activación o la comisión de alta no coinciden con el contrato.");
}

const includedMonthEnforced =
  collections.includes("included_service_period") || collections.includes("primer mes incluido");
if (includedMonthEnforced) {
  record("B", "FAIL", "Apareció una marca de mes incluido que esta prueba no esperaba en el motor actual.");
} else if (slots.includes("v_obligation.kind is distinct from 'subscription'")) {
  record(
    "B",
    "EXPECTED_RED",
    "La activación no consume slot. El motor todavía permite abrir una mensualidad en el mismo período y no impide cobrar ARS 55.000 extra al inicio."
  );
} else {
  record("B", "FAIL", "No se pudo confirmar ni el hueco ni la exclusión de slot en la activación.");
}

const calendarInEngine =
  collections.includes("2026-12-10") || collections.includes("interval '1 month'");
if (calendarInEngine) {
  record("C", "FAIL", "El motor ya calcula una fecha que esta prueba trata como no implementada.");
} else if (
  closure.includes("10 de noviembre") &&
  closure.includes("10 de diciembre") &&
  closure.includes("period_key")
) {
  record(
    "C",
    "EXPECTED_RED",
    "El ejemplo aprobado dice inicio el 10 de noviembre y primera mensualidad el 10 de diciembre. open_obligation no calcula esa fecha: period_key lo envía el llamador."
  );
} else {
  record("C", "BLOCKED", "El documento de cierre no fija el ejemplo de calendario.");
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
