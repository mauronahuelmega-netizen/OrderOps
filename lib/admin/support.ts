const ADMIN_SUPPORT_WHATSAPP = "5491100000000";

export function getAdminSupportWhatsappUrl() {
  const text = encodeURIComponent(
    "Hola, necesito ayuda para acceder a mi panel de administración."
  );

  return `https://wa.me/${ADMIN_SUPPORT_WHATSAPP}?text=${text}`;
}
