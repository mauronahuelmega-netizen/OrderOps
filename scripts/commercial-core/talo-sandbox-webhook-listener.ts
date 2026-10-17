import { createServer } from "node:http";

import {
  createSandboxWebhookState,
  handleTaloSandboxCustomerWebhook,
  readTaloSandboxCustomerTransaction,
  TALO_SANDBOX_WEBHOOK_HOST,
  TALO_SANDBOX_WEBHOOK_PATH,
  TALO_SANDBOX_WEBHOOK_PORT,
  taloSandboxWebhookResponse
} from "@/lib/commercial/payments/talo-sandbox-webhook-route";

function main(): void {
  if (!process.argv.includes("--listen")) {
    console.log("listener_not_started");
    console.log(`bind: ${TALO_SANDBOX_WEBHOOK_HOST}:${TALO_SANDBOX_WEBHOOK_PORT}`);
    console.log(`path: ${TALO_SANDBOX_WEBHOOK_PATH}`);
    return;
  }

  const state = createSandboxWebhookState();
  const server = createServer((incoming, outgoing) => {
    const url = new URL(incoming.url ?? "/", "http://127.0.0.1");
    if (incoming.method !== "POST" || url.pathname !== TALO_SANDBOX_WEBHOOK_PATH) {
      outgoing.writeHead(404);
      outgoing.end();
      return;
    }
    const chunks: Buffer[] = [];
    incoming.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    incoming.on("end", () => {
      const request = new Request(`http://127.0.0.1${TALO_SANDBOX_WEBHOOK_PATH}`, {
        method: "POST",
        headers: Object.fromEntries(Object.entries(incoming.headers).flatMap(([name, value]) => {
          if (Array.isArray(value)) {
            return [[name, value.join(", ")]];
          }
          return typeof value === "string" ? [[name, value]] : [];
        })),
        body: Buffer.concat(chunks)
      });
      void handleTaloSandboxCustomerWebhook({
        request,
        env: { ...process.env, COMMERCIAL_TALO_WEBHOOK_LISTENER: "1" },
        remoteAddress: incoming.socket.remoteAddress ?? "local",
        receipts: state.receipts,
        rateLimit: state.rateLimit,
        readTransaction: (customerId, transactionId) => readTaloSandboxCustomerTransaction(process.env, customerId, transactionId)
      }).then((handling) => {
        const response = taloSandboxWebhookResponse(handling);
        void response.arrayBuffer().then((body) => {
          outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
          outgoing.end(Buffer.from(body));
        });
      });
    });
  });
  server.listen(TALO_SANDBOX_WEBHOOK_PORT, TALO_SANDBOX_WEBHOOK_HOST);
}

main();
