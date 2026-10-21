import assert from "node:assert/strict";

import { hashDemoIp, prepareDemoRateLimitHash, TRUSTED_DEMO_IP_HEADER } from "@/lib/commercial/crm/demo-ip";

const salt = "fixture-salt";
const trusted = "203.0.113.10";

function headers(values: Record<string, string | undefined>) {
  return (name: string) => values[name] ?? null;
}

const same = prepareDemoRateLimitHash({
  vercelEnv: "1",
  salt,
  getHeader: headers({
    [TRUSTED_DEMO_IP_HEADER]: trusted,
    "x-forwarded-for": "198.51.100.20, 203.0.113.10"
  })
});
const spoofedForwarded = prepareDemoRateLimitHash({
  vercelEnv: "1",
  salt,
  getHeader: headers({
    [TRUSTED_DEMO_IP_HEADER]: trusted,
    "x-forwarded-for": "198.51.100.99"
  })
});
assert.equal(typeof same, "string");
assert.equal(same, spoofedForwarded);
assert.equal(same, hashDemoIp(trusted, salt));

assert.equal(
  prepareDemoRateLimitHash({
    vercelEnv: "1",
    salt,
    getHeader: headers({ [TRUSTED_DEMO_IP_HEADER]: "198.51.100.21" })
  }) === same,
  false
);

assert.equal(
  prepareDemoRateLimitHash({
    vercelEnv: undefined,
    salt,
    getHeader: headers({
      [TRUSTED_DEMO_IP_HEADER]: trusted,
      "x-forwarded-for": trusted
    })
  }),
  null
);
assert.equal(
  prepareDemoRateLimitHash({
    vercelEnv: "1",
    salt: undefined,
    getHeader: headers({ [TRUSTED_DEMO_IP_HEADER]: trusted })
  }),
  null
);
assert.equal(
  prepareDemoRateLimitHash({
    vercelEnv: "1",
    salt: "   ",
    getHeader: headers({ [TRUSTED_DEMO_IP_HEADER]: trusted })
  }),
  null
);
assert.equal(
  prepareDemoRateLimitHash({
    vercelEnv: "1",
    salt,
    getHeader: headers({ "x-forwarded-for": trusted })
  }),
  null
);
assert.equal(
  prepareDemoRateLimitHash({
    vercelEnv: "1",
    salt,
    getHeader: headers({ [TRUSTED_DEMO_IP_HEADER]: "203.0.113.10, 198.51.100.1" })
  }),
  null
);

console.log("demo-ip.verify: ok");
