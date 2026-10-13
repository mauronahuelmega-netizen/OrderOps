import assert from "node:assert/strict";

import { decideCommissionAvailability } from "@/lib/commercial/commissions/availability";

const posted = new Date("2026-10-01T12:00:00.000Z");
const day10 = new Date(posted.getTime() + 10 * 24 * 60 * 60 * 1000);
const day16 = new Date(posted.getTime() + 16 * 24 * 60 * 60 * 1000);

const g01 = decideCommissionAvailability({
  rightKind: "setup",
  postedAt: posted,
  asOf: day16,
  onboardingCompleted: false,
  releaseException: false,
  holdUnpaid: false
});
assert.equal(g01.status, "pending");

const g02 = decideCommissionAvailability({
  rightKind: "setup",
  postedAt: posted,
  asOf: day16,
  onboardingCompleted: true,
  releaseException: false,
  holdUnpaid: false
});
assert.equal(g02.status, "available");

const g03 = decideCommissionAvailability({
  rightKind: "setup",
  postedAt: posted,
  asOf: day10,
  onboardingCompleted: true,
  releaseException: false,
  holdUnpaid: false
});
assert.equal(g03.status, "pending");

const g04 = decideCommissionAvailability({
  rightKind: "setup",
  postedAt: posted,
  asOf: day10,
  onboardingCompleted: false,
  releaseException: true,
  holdUnpaid: false
});
assert.equal(g04.status, "available");

const recurring = decideCommissionAvailability({
  rightKind: "recurring",
  postedAt: posted,
  asOf: day16,
  onboardingCompleted: false,
  releaseException: false,
  holdUnpaid: false
});
assert.equal(recurring.status, "available");

const held = decideCommissionAvailability({
  rightKind: "recurring",
  postedAt: posted,
  asOf: day16,
  onboardingCompleted: true,
  releaseException: false,
  holdUnpaid: true
});
assert.equal(held.status, "held");

console.log("availability.verify: ok");
