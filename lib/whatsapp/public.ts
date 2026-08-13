export function buildPublicOrderWhatsappUrl(input: {
  whatsappNumber: string;
  orderId?: string;
}) {
  const cleanedNumber = input.whatsappNumber.replace(/[^\d]/g, "");
  const lines = ["¡Hola! Ya registré mi pedido en OrderOps."];

  if (input.orderId) {
    lines.push(`Pedido: ${input.orderId}`);
  }

  lines.push("Te escribo para continuar la confirmación por WhatsApp.");

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
