import { createWebhookRateLimit } from "@/lib/commercial/payments/talo-sandbox-webhook-route";
import { readTaloRuntime } from "@/lib/commercial/payments/talo-runtime";
import { handleTaloWebhookNotice, taloWebhookInboxResponse } from "@/lib/commercial/payments/talo-webhook-inbox";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimit = createWebhookRateLimit(60, 60_000);

export async function POST(request: Request): Promise<Response> {
  const remoteAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const handling = await handleTaloWebhookNotice({
    request,
    runtime: readTaloRuntime(process.env),
    remoteAddress,
    rateLimit,
    enqueue: async ({ environment, customerId, transactionId, signaturePresent }) => {
      const { data, error } = await createSupabaseServiceClient().rpc("system_enqueue_provider_webhook", {
        p_provider: "talo",
        p_environment: environment,
        p_external_customer_id: customerId,
        p_external_transaction_id: transactionId,
        p_signature_present: signaturePresent
      });
      if (error || !data || typeof data !== "object") {
        throw new Error("enqueue_failed");
      }
      const result = data as { ok?: boolean; duplicate?: boolean; commercial_error_code?: string };
      return result.ok === true
        ? { ok: true, duplicate: result.duplicate === true }
        : { ok: false, code: result.commercial_error_code ?? "unknown" };
    }
  });
  return taloWebhookInboxResponse(handling);
}
