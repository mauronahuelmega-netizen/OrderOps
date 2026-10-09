/** Fictional presentation fixtures. No operational IDs, payloads or customer data. */
export const illustrativeOrder = {
  reference: "J3E54J", business: "Casa Burger", customer: "Alex", product: "BBQ Bacon", basePrice: "$13.500", total: "$17.950",
  items: [
    { label: "BBQ Bacon", detail: "1 unidad", price: "$13.500" },
    { label: "Papas medianas", detail: "Mayonesa · sin cebolla", price: "+ $950" },
    { label: "Bacon extra", detail: "1 adicional", price: "+ $1.000" },
    { label: "Limonada", detail: "1 bebida", price: "$2.500" }
  ]
} as const;

export const orderStages = [
  { key: "pending", label: "Pendiente", column: "Pendientes", description: "El pedido ya está registrado, con sus productos y datos reunidos." },
  { key: "preparing", label: "Preparando", column: "Preparando", description: "El negocio cambia el estado cuando empieza a preparar el pedido." },
  { key: "ready", label: "Listo", column: "Listos", description: "Todo listo para retirar o entregar. Podés avisarle al cliente por WhatsApp." },
  { key: "completed", label: "Completado", column: "Completados", description: "El negocio marca el pedido como completado y cierra su recorrido." }
] as const;

export const faqs = [
  { question: "¿Necesito tener una web?", answer: "No necesitás una web propia para compartir el catálogo. OrderOps tiene un catálogo público por negocio, al que tus clientes pueden entrar desde un enlace." },
  { question: "¿Tengo que dejar de usar WhatsApp?", answer: "No. El cliente arma y registra su pedido en el catálogo y después puede abrir WhatsApp para confirmarlo. Vos seguís usando WhatsApp para comunicarte con él. Los mensajes preparados se abren para que los envíes; no se envían automáticamente." },
  { question: "¿OrderOps cobra comisión por pedido?", answer: "No. El modelo comercial es por suscripción, sin comisión por pedido. Consultanos en la demo por las condiciones de contratación." },
  { question: "¿Puedo cargar un pedido manualmente?", answer: "Sí. El panel permite crear pedidos manuales a los usuarios con permisos para gestionar pedidos, por ejemplo cuando recibís un pedido por otro canal." },
  { question: "¿Puedo personalizar el catálogo?", answer: "Podés configurar la marca del negocio, imágenes, colores y textos del catálogo. Las opciones, extras y productos complementarios también están implementados; su habilitación y configuración se revisan para cada negocio." },
  { question: "¿Puedo decidir cuándo recibir pedidos?", answer: "Sí. La recepción de pedidos depende del estado operativo del negocio. Los productos que no están disponibles no se ofrecen en el catálogo." },
  { question: "¿Mis clientes necesitan una cuenta?", answer: "No necesitan iniciar sesión para usar el catálogo público. Para enviar el pedido completan sus datos de contacto y, cuando corresponde, la dirección de entrega." }
] as const;

/** Future analytics contract only: no provider, listeners, storage or network sink. */
export type MarketingEventName = "landing_view" | "demo_cta_click" | "whatsapp_cta_click" | "pricing_view" | "faq_interaction" | "product_demo_interaction" | "login_click";
