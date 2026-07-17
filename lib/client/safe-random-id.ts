/**
 * Client-safe ID generator for browser contexts where `crypto.randomUUID`
 * may be missing (e.g. non-secure LAN origins like http://192.168.x.x).
 * Never import Node `crypto` from client components.
 */
export function createClientSafeId(prefix = "id"): string {
  const cryptoObject =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return `${prefix}-${cryptoObject.randomUUID()}`;
  }

  if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoObject.getRandomValues(bytes);
    // UUID v4 fallback.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    const uuid = [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20)
    ].join("-");
    return `${prefix}-${uuid}`;
  }

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${timestamp}-${random}`;
}
