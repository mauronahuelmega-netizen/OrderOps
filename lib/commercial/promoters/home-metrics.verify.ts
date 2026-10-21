import assert from "node:assert/strict";
import {
  greetingName,
  greetingPrefixByHour,
  greetingText,
  openOpportunityCount,
  pendingTaskCounts
} from "@/lib/commercial/promoters/home-metrics";

assert.equal(greetingName("  Ana  "), "Ana");
assert.equal(greetingName("   "), null);
assert.equal(greetingName(null), null);

assert.equal(greetingPrefixByHour(0), "Buenas noches");
assert.equal(greetingPrefixByHour(4), "Buenas noches");
assert.equal(greetingPrefixByHour(5), "Buen día");
assert.equal(greetingPrefixByHour(12), "Buen día");
assert.equal(greetingPrefixByHour(13), "Buenas tardes");
assert.equal(greetingPrefixByHour(19), "Buenas tardes");
assert.equal(greetingPrefixByHour(20), "Buenas noches");
assert.equal(greetingPrefixByHour(23), "Buenas noches");

assert.equal(greetingText("Ana", new Date(2026, 9, 19, 4, 59, 0)), "Buenas noches, Ana");
assert.equal(greetingText("Ana", new Date(2026, 9, 19, 5, 0, 0)), "Buen día, Ana");
assert.equal(greetingText("Ana", new Date(2026, 9, 19, 12, 59, 0)), "Buen día, Ana");
assert.equal(greetingText("Ana", new Date(2026, 9, 19, 13, 0, 0)), "Buenas tardes, Ana");
assert.equal(greetingText("Ana", new Date(2026, 9, 19, 19, 59, 0)), "Buenas tardes, Ana");
assert.equal(greetingText("Ana", new Date(2026, 9, 19, 20, 0, 0)), "Buenas noches, Ana");
assert.equal(greetingText("Ana", new Date(2026, 9, 19, 0, 0, 0)), "Buenas noches, Ana");
assert.equal(greetingText(null, new Date(2026, 9, 19, 14, 0, 0)), "Buenas tardes");

assert.equal(openOpportunityCount([
  { stage: "new" },
  { stage: "lost" },
  { stage: "won" },
  { stage: "follow_up" },
  {}
]), 2);

const now = new Date(2026, 9, 18, 12, 0, 0);
const counts = pendingTaskCounts([
  { status: "open", due_at: "2026-10-16T12:00:00" },
  { status: "open", due_at: "2026-10-18T18:00:00" },
  { status: "open", due_at: "2026-10-20T18:00:00" },
  { status: "done", due_at: "2026-10-16T12:00:00" },
  { status: "cancelled", due_at: "2026-10-16T12:00:00" },
  { status: "open", due_at: null }
], now);

assert.equal(counts.overdue, 1);
assert.equal(counts.pending, 3);
assert.equal(counts.groups.today.length, 1);
assert.equal(counts.groups.upcoming.length, 1);
assert.equal(counts.pending, counts.groups.today.length + counts.groups.upcoming.length + counts.overdue);

console.log("home-metrics.verify: ok");
