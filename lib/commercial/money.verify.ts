import assert from "node:assert/strict";
import { arsInputToCents, formatArsFromCents } from "./money";

assert.equal(formatArsFromCents(2200000), "$ 22.000,00");
assert.equal(formatArsFromCents(-2200000), "-$ 22.000,00");
assert.equal(arsInputToCents("22000"), 2200000);
assert.equal(arsInputToCents("22000,50"), 2200050);
assert.equal(arsInputToCents("22.000"), null);
