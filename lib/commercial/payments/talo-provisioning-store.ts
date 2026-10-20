import "server-only";

import type { ProviderLink, ProvisioningStore } from "@/lib/commercial/payments/talo-provisioning";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type LinkPayload = {
  ok?: boolean;
  found?: boolean;
  external_customer_id?: string;
  cvu?: string | null;
  alias?: string | null;
  commercial_error_code?: string;
};

export function createServiceProvisioningStore(): ProvisioningStore {
  const client = createSupabaseServiceClient();
  return {
    async readLink(businessId, environment): Promise<ProviderLink> {
      const { data, error } = await client.rpc("system_provider_customer_link", {
        p_business_id: businessId,
        p_provider: "talo",
        p_environment: environment
      });
      const payload = (data ?? null) as LinkPayload | null;
      if (error || !payload || payload.ok !== true) {
        throw new Error("provider_link_read_failed");
      }
      if (payload.found !== true || typeof payload.external_customer_id !== "string") {
        return { found: false };
      }
      return {
        found: true,
        externalCustomerId: payload.external_customer_id,
        cvu: payload.cvu ?? null,
        alias: payload.alias ?? null
      };
    },
    async saveLink(input) {
      const { data, error } = await client.rpc("system_link_provider_customer", {
        p_business_id: input.businessId,
        p_provider: "talo",
        p_environment: input.environment,
        p_external_customer_id: input.externalCustomerId,
        p_cvu: input.cvu,
        p_alias: input.alias
      });
      const payload = (data ?? null) as LinkPayload | null;
      if (error || !payload) {
        return { ok: false, code: "provider_link_write_failed" };
      }
      return payload.ok === true ? { ok: true } : { ok: false, code: payload.commercial_error_code ?? "unknown" };
    }
  };
}
