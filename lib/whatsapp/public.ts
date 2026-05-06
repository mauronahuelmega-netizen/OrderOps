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
