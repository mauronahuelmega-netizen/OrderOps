/** Fictional presentation fixtures. No operational IDs, payloads or customer data. */
export const illustrativeOrder = {
  reference: "J3E54J", business: "Casa Burger", customer: "Alex", product: "BBQ Bacon", basePrice: "$13.500", total: "$17.950",
  productSubtotal: "$15.450", method: "Retiro", note: "Sin cebolla",
  amounts: { base: 13500, potatoes: 950, bacon: 1000, beverage: 2500 },
  selections: { potatoes: "Medianas", extra: "Bacon extra", sauce: "Mayonesa" },
  message: "Tu pedido #J3E54J ya está en preparación."
} as const;

export const illustrativeContextOrders = [
  { reference: "K7M4Q9", customer: "Sam", method: "Delivery", summary: "2 × Clásica", total: "$24.000", stage: "preparing" },
  { reference: "N8R3W6", customer: "Dani", method: "Retiro", summary: "1 × Doble cheddar", total: "$14.000", stage: "preparing" },
  { reference: "P5T2X8", customer: "Cris", method: "Retiro", summary: "1 × Veggie", total: "$12.500", stage: "ready" }
] as const;

export const orderStages = [
  { key: "pending", label: "Pendiente", column: "Pendientes", description: "El pedido ya está registrado, con sus productos y datos reunidos." },
  { key: "preparing", label: "Preparando", column: "Preparando", description: "El negocio cambia el estado cuando empieza a preparar el pedido." },
  { key: "ready", label: "Listo", column: "Listos", description: "Todo listo para retirar o entregar. Podés avisarle al cliente por WhatsApp." },
  { key: "completed", label: "Completado", column: "Completados", description: "El negocio marca el pedido como completado y cierra su recorrido." }
] as const;

export type MarketingStage = typeof orderStages[number]["key"];
export function getIllustrativeStageCount(stage: MarketingStage, activeStage: MarketingStage) {
  return illustrativeContextOrders.filter(order => order.stage === stage).length + Number(stage === activeStage);
}

export const faqs = [
  { question: "¿Necesito tener una web?", answer: "No. Tu negocio tiene un catálogo público que compartís con un enlace." },
  { question: "¿Tengo que dejar de usar WhatsApp?", answer: "No. El cliente registra el pedido en el catálogo y después puede confirmarlo por WhatsApp. Vos seguís conversando con él; los mensajes preparados se envían manualmente." },
  { question: "¿OrderOps cobra comisión por pedido?", answer: "No. Funciona por suscripción, con 0% de comisión por pedido. Conocé las condiciones para tu negocio en la demo." },
  { question: "¿Puedo cargar un pedido manualmente?", answer: "Sí. Los usuarios con permisos para gestionar pedidos pueden cargarlos desde el panel, también cuando llegan por otro canal." },
  { question: "¿Puedo personalizar el catálogo?", answer: "Sí: marca, imágenes, colores y textos. Las opciones, extras y complementarios se habilitan y configuran según tu negocio." },
  { question: "¿Puedo decidir cuándo recibir pedidos?", answer: "Sí. Podés habilitar o pausar la recepción según el estado operativo del negocio. Los productos no disponibles no se ofrecen en el catálogo." },
  { question: "¿Mis clientes necesitan una cuenta?", answer: "No. Completan sus datos de contacto y, si corresponde, la dirección de entrega al enviar el pedido." }
] as const;

/** Future analytics contract only: no provider, listeners, storage or network sink. */
export type MarketingEventName = "landing_view" | "demo_cta_click" | "whatsapp_cta_click" | "pricing_view" | "faq_interaction" | "product_demo_interaction" | "login_click";
