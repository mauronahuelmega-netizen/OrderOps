import {
  createSandboxWebhookState,
  handleTaloSandboxCustomerWebhook,
  readTaloSandboxCustomerTransaction,
  taloSandboxWebhookResponse
} from "@/lib/commercial/payments/talo-sandbox-webhook-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const state = createSandboxWebhookState();

export async function POST(request: Request): Promise<Response> {
  const remoteAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const handling = await handleTaloSandboxCustomerWebhook({
    request,
    env: process.env,
    remoteAddress,
    receipts: state.receipts,
    rateLimit: state.rateLimit,
    readTransaction: (customerId, transactionId) => readTaloSandboxCustomerTransaction(process.env, customerId, transactionId)
  });
  return taloSandboxWebhookResponse(handling);
}
