import {
  bankIdentity,
  listedCount,
  listedCustomer,
  prefixMissing,
  readJson,
  sameBankIdentity,
  tokenFrom,
  type BankIdentity
} from "@/lib/commercial/payments/talo-persistent-cvu";
import type { TaloRuntime } from "@/lib/commercial/payments/talo-runtime";

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export type ProviderLink =
  | { found: false }
  | { found: true; externalCustomerId: string; cvu: string | null; alias: string | null };

export type ProvisioningStore = {
  readLink(businessId: string, environment: "sandbox"): Promise<ProviderLink>;
  saveLink(input: {
    businessId: string;
    environment: "sandbox";
    externalCustomerId: string;
    cvu: string;
    alias: string;
  }): Promise<{ ok: true } | { ok: false; code: string }>;
};

export type ProvisioningResult =
  | { status: "linked"; created: boolean; reused: boolean }
  | { status: "blocked"; reason: string }
  | { status: "failed"; reason: string; httpStatus: number | null };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function taloCustomerIdFor(businessId: string): string {
  return `orderops-${businessId.toLowerCase()}`;
}

// Talo prepends the account alias prefix; the suffix only has to be stable and unique per business.
export function taloAliasSuffixFor(businessId: string): string {
  return `oo${businessId.replace(/-/g, "").slice(0, 10).toLowerCase()}`;
}

export async function ensureTaloBusinessCustomer(input: {
  businessId: string;
  businessName: string;
  runtime: TaloRuntime;
  store: ProvisioningStore;
  fetchImpl?: Fetch;
}): Promise<ProvisioningResult> {
  const { runtime, store, businessId } = input;
  if (runtime.status !== "ready") {
    return { status: "blocked", reason: runtime.status === "blocked" ? runtime.reason : "disabled" };
  }
  if (!uuidPattern.test(businessId)) {
    return { status: "blocked", reason: "business_id_invalid" };
  }
  const customerId = taloCustomerIdFor(businessId);
  const existingLink = await store.readLink(businessId, runtime.environment);
  if (existingLink.found) {
    if (existingLink.externalCustomerId !== customerId) {
      return { status: "blocked", reason: "link_customer_mismatch" };
    }
    if (existingLink.cvu && existingLink.alias) {
      return { status: "linked", created: false, reused: true };
    }
  }

  const fetchImpl: Fetch = input.fetchImpl ?? ((url, init) => fetch(url, init));
  const tokenResponse = await fetchImpl(`${runtime.origin}/users/${encodeURIComponent(runtime.userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: runtime.clientId, client_secret: runtime.clientSecret })
  });
  const token = tokenFrom(await readJson(tokenResponse));
  if (!tokenResponse.ok || !token) {
    return { status: "failed", reason: "token_rejected", httpStatus: tokenResponse.status };
  }
  const headers = { authorization: `Bearer ${token}`, accept: "application/json", "content-type": "application/json" };
  const customerPath = `${runtime.origin}/customers/${encodeURIComponent(customerId)}`;
  const listPath = `${runtime.origin}/customers/?user_id=${encodeURIComponent(runtime.userId)}`;

  const listResponse = await fetchImpl(listPath, { headers });
  const listBody = await readJson(listResponse);
  if (listedCount(listBody, customerId) > 1) {
    return { status: "failed", reason: "duplicate_customer", httpStatus: listResponse.status };
  }
  const getResponse = await fetchImpl(customerPath, { headers });
  let issued: BankIdentity | null = bankIdentity(await readJson(getResponse)) ?? listedCustomer(listBody, customerId);
  let created = false;

  if (!issued) {
    // webhook_url is only documented at creation, so a customer is never created without a stable URL.
    if (!runtime.webhookUrl) {
      return { status: "blocked", reason: "stable_webhook_url_required" };
    }
    const createResponse = await fetchImpl(`${runtime.origin}/customers/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: runtime.userId,
        alias: taloAliasSuffixFor(businessId),
        customer_id: customerId,
        name: input.businessName.slice(0, 80),
        webhook_url: runtime.webhookUrl
      })
    });
    const createBody = await readJson(createResponse);
    if (prefixMissing(createBody)) {
      return { status: "blocked", reason: "alias_prefix_missing" };
    }
    issued = bankIdentity(createBody);
    if (!createResponse.ok || !issued) {
      return { status: "failed", reason: "create_rejected", httpStatus: createResponse.status };
    }
    created = true;
  }

  const rereadResponse = await fetchImpl(customerPath, { headers });
  const reread = bankIdentity(await readJson(rereadResponse));
  if (!reread || !sameBankIdentity(issued, reread)) {
    return { status: "failed", reason: "cvu_not_stable", httpStatus: rereadResponse.status };
  }
  if (existingLink.found && existingLink.cvu && existingLink.cvu !== reread.cvu) {
    return { status: "blocked", reason: "link_cvu_mismatch" };
  }

  const saved = await store.saveLink({
    businessId,
    environment: runtime.environment,
    externalCustomerId: customerId,
    cvu: reread.cvu,
    alias: reread.alias
  });
  if (!saved.ok) {
    return { status: "failed", reason: saved.code, httpStatus: null };
  }
  return { status: "linked", created, reused: false };
}
