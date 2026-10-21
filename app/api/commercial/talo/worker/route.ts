import { readTaloSandboxCustomerTransaction } from "@/lib/commercial/payments/talo-sandbox-webhook-route";
import { runTaloReceiptWorker } from "@/lib/commercial/payments/talo-receipt-worker";
import { readTaloRuntime } from "@/lib/commercial/payments/talo-runtime";
import { isAuthorizedWorkerRequest } from "@/lib/commercial/payments/worker-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const talo = readTaloRuntime(process.env);
  if (talo.status !== "ready" || !isAuthorizedWorkerRequest(request, process.env.COMMERCIAL_WORKER_SECRET)) {
    return new Response(null, { status: 404 });
  }
  const client = createSupabaseServiceClient();
  const summary = await runTaloReceiptWorker({
    environment: talo.environment,
    async claim(limit) {
      const { data, error } = await client.rpc("system_claim_provider_webhooks", { p_limit: limit });
      if (error || !data) {
        throw new Error("claim_failed");
      }
      return data.map((row) => ({
        inboxId: row.inbox_id,
        environment: row.environment,
        customerId: row.external_customer_id,
        transactionId: row.external_transaction_id
      }));
    },
    read(customerId, transactionId) {
      return readTaloSandboxCustomerTransaction(process.env, customerId, transactionId);
    },
    async record(input) {
      const { data, error } = await client.rpc("system_record_provider_read", {
        p_inbox_id: input.inboxId,
        p_provider_status: input.providerStatus,
        p_currency: input.currency,
        p_gross_amount_cents: input.grossAmountCents,
        p_net_amount_cents: input.netAmountCents,
        p_gross_source: input.grossSource,
        p_net_source: input.netSource,
        p_provider_timestamp: input.providerTimestamp,
        p_response_digest: input.responseDigest
      });
      if (error || !data || typeof data !== "object") {
        throw new Error("record_failed");
      }
      const result = data as { ok?: boolean; status?: string; commercial_error_code?: string };
      return { ok: result.ok === true, status: result.status, code: result.commercial_error_code };
    },
    async defer(inboxId, reason) {
      const { error } = await client.rpc("system_defer_provider_webhook", { p_inbox_id: inboxId, p_error: reason });
      if (error) {
        throw new Error("defer_failed");
      }
    }
  });
  return Response.json({ ...summary, economicRecognitionByNotice: false });
}
