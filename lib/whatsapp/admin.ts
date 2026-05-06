export function buildAdminOrderWhatsappUrl(input: {
  customerPhone: string;
  orderId: string;
}) {
  const cleanedPhone = input.customerPhone.replace(/[^\d]/g, "");
  const message = encodeURIComponent(
    `¡Hola! Te escribo por tu pedido ${input.orderId} en OrderOps.`
  );

  return `https://wa.me/${cleanedPhone}?text=${message}`;
}
