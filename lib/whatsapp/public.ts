export function buildPublicOrderWhatsappUrl(input: {
  whatsappNumber: string;
  businessName?: string;
  orderId?: string;
  orderRef?: string;
}) {
  const cleanedNumber = input.whatsappNumber.replace(/[^\d]/g, "");
  const businessGreeting = input.businessName?.trim()
    ? `Hola ${input.businessName.trim()}`
    : "Hola";

  const rawRef = (input.orderRef || input.orderId || "").trim();
  const orderCode = rawRef.replace(/^#+/, "");

  const firstLine = orderCode
    ? `${businessGreeting}, ya hice mi pedido ${orderCode} desde el catálogo online.`
    : `${businessGreeting}, ya hice mi pedido desde el catálogo online.`;

  const lines = [
    firstLine,
    "Te escribo para confirmarlo."
  ];

  const message = encodeURIComponent(lines.join("\n"));

  return `https://wa.me/${cleanedNumber}?text=${message}`;
}

/**
 * Inquiry CTA for public entry fallback when catalog is not ready.
 * Returns null when the number cannot form a valid wa.me destination.
 */
export function buildPublicBusinessInquiryWhatsappUrl(params: {
  businessName: string;
  whatsappNumber: string | null | undefined;
}): string | null {
  const digits = params.whatsappNumber?.replace(/[^\d]/g, "") ?? "";

  if (digits.length === 0) {
    return null;
  }

  const message = `Hola, quiero consultar por el catálogo de ${params.businessName}.`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
