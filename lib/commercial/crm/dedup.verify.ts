import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { classifyDedup } from "@/lib/commercial/crm/dedup";
import { normalizeArPhone, normalizeCommercialName } from "@/lib/commercial/crm/normalize";

const phone = normalizeArPhone("11 5555-0101");
assert.equal(phone, "+5491155550101");
assert.equal(normalizeArPhone("+54 9 11 5555-0101"), phone);
assert.equal(normalizeArPhone("no-es-telefono"), null);
assert.equal(normalizeCommercialName("Panadería Norte"), "panaderia norte");

assert.equal(
  classifyDedup({
    leftName: "Panadería Norte",
    rightName: "panaderia norte",
    leftPhone: "11 5555-0101",
    rightPhone: "+54 9 11 5555-0101"
  }),
  "high"
);

assert.equal(
  classifyDedup({
    leftName: "Panadería Norte",
    rightName: "Panadería Norte",
    leftPhone: "11 5555-0101",
    rightPhone: "11 5555-0102"
  }),
  "probable"
);

assert.equal(
  classifyDedup({
    leftName: "Panadería Norte",
    rightName: "Farmacia Sur",
    leftPhone: "11 5555-0101",
    rightPhone: "11 5555-0101"
  }),
  "probable"
);

assert.equal(
  classifyDedup({
    leftName: "Panadería Norte",
    rightName: "Panadería Norte",
    leftPhone: "11 5555-0101",
    rightPhone: "+54 9 11 5555-0101",
    leftFiscalId: "20111111112",
    rightFiscalId: "20222222223"
  }),
  "probable"
);

assert.equal(
  classifyDedup({
    leftName: "Panadería Norte",
    rightName: "Farmacia Sur",
    leftPhone: "11 5555-0101",
    rightPhone: "11 4444-0101"
  }),
  "none"
);

const sql = readFileSync("supabase/migrations/20261009004940_commercial_phase02_dedup.sql", "utf8");
assert.equal(sql.includes("pg_advisory_xact_lock"), true);
assert.equal(sql.includes("select *"), false);
assert.equal(sql.includes("attribution_claims"), false);

console.log("dedup.verify: ok");
