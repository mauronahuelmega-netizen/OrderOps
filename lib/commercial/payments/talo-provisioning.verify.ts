import assert from "node:assert/strict";

import {
  ensureTaloBusinessCustomer,
  taloAliasSuffixFor,
  taloCustomerIdFor,
  type ProviderLink,
  type ProvisioningStore
} from "@/lib/commercial/payments/talo-provisioning";
import type { TaloRuntime } from "@/lib/commercial/payments/talo-runtime";

const businessId = "96969696-9696-4969-8969-9696969696d1";
const otherBusinessId = "96969696-9696-4969-8969-9696969696d2";

const runtime: Extract<TaloRuntime, { status: "ready" }> = {
  status: "ready",
  environment: "sandbox",
  origin: "https://sandbox-api.talo.com.ar",
  userId: "user",
  clientId: "client",
  clientSecret: "secret",
  webhookUrl: "https://app.orderops.example/api/commercial/talo/webhook"
};

type FakeCustomer = { customer_id: string; bank_info: { cvu: string; alias: string }; webhook_url?: string };

function fakeTalo(seed: FakeCustomer[] = []) {
  const customers = [...seed];
  const log: { method: string; path: string; body: Record<string, unknown> | null }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit): Promise<Response> => {
    const parsed = new URL(url);
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    log.push({ method, path: parsed.pathname, body });
    if (parsed.pathname.endsWith("/tokens")) {
      return Response.json({ data: { token: "t" } });
    }
    if (method === "GET" && parsed.pathname === "/customers/") {
      return Response.json({ data: { customers } });
    }
    if (method === "GET" && parsed.pathname.startsWith("/customers/")) {
      const id = decodeURIComponent(parsed.pathname.slice("/customers/".length));
      const found = customers.find((customer) => customer.customer_id === id);
      return found ? Response.json({ data: found }) : Response.json({ message: "not found" }, { status: 404 });
    }
    if (method === "POST" && parsed.pathname === "/customers/" && body) {
      const created: FakeCustomer = {
        customer_id: String(body.customer_id),
        bank_info: { cvu: `000000310000${customers.length}`, alias: `prefix.${String(body.alias)}` },
        webhook_url: String(body.webhook_url)
      };
      customers.push(created);
      return Response.json({ data: created }, { status: 201 });
    }
    return new Response(null, { status: 500 });
  };
  return { customers, log, fetchImpl };
}

function memoryStore(): ProvisioningStore & { links: Map<string, ProviderLink & { found: true }> } {
  const links = new Map<string, ProviderLink & { found: true }>();
  return {
    links,
    async readLink(id) {
      return links.get(id) ?? { found: false };
    },
    async saveLink(input) {
      const existing = links.get(input.businessId);
      if (existing && (existing.cvu !== input.cvu || existing.alias !== input.alias)) {
        return { ok: false, code: "customer_link_conflict" };
      }
      links.set(input.businessId, { found: true, externalCustomerId: input.externalCustomerId, cvu: input.cvu, alias: input.alias });
      return { ok: true };
    }
  };
}

async function main(): Promise<void> {
  assert.equal(taloCustomerIdFor(businessId), `orderops-${businessId}`);
  assert.notEqual(taloAliasSuffixFor(businessId), taloAliasSuffixFor("11111111-9696-4969-8969-9696969696d1"));

  const talo = fakeTalo();
  const store = memoryStore();
  const first = await ensureTaloBusinessCustomer({ businessId, businessName: "Negocio", runtime, store, fetchImpl: talo.fetchImpl });
  assert.deepEqual(first, { status: "linked", created: true, reused: false });
  assert.equal(talo.customers.length, 1);
  assert.equal(talo.customers[0]?.webhook_url, runtime.webhookUrl);
  assert.equal(store.links.get(businessId)?.cvu, talo.customers[0]?.bank_info.cvu);

  const callsBefore = talo.log.length;
  const again = await ensureTaloBusinessCustomer({ businessId, businessName: "Negocio", runtime, store, fetchImpl: talo.fetchImpl });
  assert.deepEqual(again, { status: "linked", created: false, reused: true });
  assert.equal(talo.log.length, callsBefore);

  const lostLink = memoryStore();
  const recovered = await ensureTaloBusinessCustomer({ businessId, businessName: "Negocio", runtime, store: lostLink, fetchImpl: talo.fetchImpl });
  assert.deepEqual(recovered, { status: "linked", created: false, reused: false });
  assert.equal(talo.customers.length, 1);

  const second = await ensureTaloBusinessCustomer({ businessId: otherBusinessId, businessName: "Otro", runtime, store, fetchImpl: talo.fetchImpl });
  assert.equal(second.status, "linked");
  assert.equal(talo.customers.length, 2);
  assert.notEqual(talo.customers[0]?.bank_info.cvu, talo.customers[1]?.bank_info.cvu);

  const noUrl = await ensureTaloBusinessCustomer({
    businessId: "96969696-9696-4969-8969-9696969696d3",
    businessName: "Sin URL",
    runtime: { ...runtime, webhookUrl: null },
    store: memoryStore(),
    fetchImpl: fakeTalo().fetchImpl
  });
  assert.deepEqual(noUrl, { status: "blocked", reason: "stable_webhook_url_required" });

  const duplicated = fakeTalo([
    { customer_id: taloCustomerIdFor(businessId), bank_info: { cvu: "1", alias: "a" } },
    { customer_id: taloCustomerIdFor(businessId), bank_info: { cvu: "2", alias: "b" } }
  ]);
  const dup = await ensureTaloBusinessCustomer({ businessId, businessName: "Negocio", runtime, store: memoryStore(), fetchImpl: duplicated.fetchImpl });
  assert.equal(dup.status === "failed" && dup.reason, "duplicate_customer");
  assert.equal(duplicated.log.some((entry) => entry.method === "POST" && entry.path === "/customers/"), false);

  const mismatch = memoryStore();
  mismatch.links.set(businessId, { found: true, externalCustomerId: "orderops-otro", cvu: "1", alias: "a" });
  const conflict = await ensureTaloBusinessCustomer({ businessId, businessName: "Negocio", runtime, store: mismatch, fetchImpl: fakeTalo().fetchImpl });
  assert.deepEqual(conflict, { status: "blocked", reason: "link_customer_mismatch" });

  const blocked = await ensureTaloBusinessCustomer({
    businessId,
    businessName: "Negocio",
    runtime: { status: "blocked", reason: "production_not_authorized" },
    store: memoryStore(),
    fetchImpl: async () => {
      throw new Error("network must not be used");
    }
  });
  assert.deepEqual(blocked, { status: "blocked", reason: "production_not_authorized" });

  const invalid = await ensureTaloBusinessCustomer({ businessId: "../x", businessName: "x", runtime, store: memoryStore(), fetchImpl: fakeTalo().fetchImpl });
  assert.deepEqual(invalid, { status: "blocked", reason: "business_id_invalid" });

  console.log("talo-provisioning.verify: PASS");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
