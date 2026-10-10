/**
 * Removes only the recorded disposable container and its private network.
 * Do not run until a human authorizes concurrency execution.
 */
import { existsSync, unlinkSync } from "node:fs";
import {
  DATABASE_NAME,
  IdentityReviewError,
  assertContainerName,
  readState,
  removeLabeledContainer,
  removeLabeledNetwork,
  statePath,
} from "./lib.mjs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

const confirmFlag = process.argv.find((arg) => arg.startsWith("--confirm-name="));
if (!confirmFlag) fail("missing --confirm-name=<exact container name>");
const confirmed = assertContainerName(confirmFlag.slice("--confirm-name=".length));
const state = readState({ requireToken: false });
if (!state || state.containerName !== confirmed || state.databaseName !== DATABASE_NAME) {
  fail("confirmation does not match the recorded disposable container");
}

try {
  removeLabeledContainer(confirmed);
  if (state.networkName) removeLabeledNetwork(state.networkName);
} catch (error) {
  if (error instanceof IdentityReviewError) {
    console.error(error.message);
    console.error("human review required; state was left in place");
    process.exit(3);
  }
  throw error;
}

if (existsSync(statePath())) unlinkSync(statePath());
console.log(`destroyed ${confirmed}`);
