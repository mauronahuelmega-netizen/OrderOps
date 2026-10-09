import { Copy, MapPin, MessageCircle, Phone, Send, ChevronDown } from "lucide-react";
import { illustrativeOrder } from "./marketing-content";
import styles from "./contact-preview.module.css";

export default function ContactPreview() {
  return <div className={styles.contact}>
    <div className={styles.header}><span><MessageCircle size={18} aria-hidden="true" /> Contacto con el cliente</span><strong>#{illustrativeOrder.reference}</strong></div>
    <div className={styles.selector}><span>Mensaje preparado</span><strong>Avisar preparación <ChevronDown size={16} aria-hidden="true" /></strong></div>
    <div className={styles.message}><p>Hola Alex 👋</p><p>Tu pedido <strong>#{illustrativeOrder.reference}</strong> ya está en preparación.</p><span>Mensaje listo para abrir en WhatsApp</span></div>
    <div className={styles.openWhatsapp}><Send size={16} aria-hidden="true" /> Abrir WhatsApp</div>
    <div className={styles.utilities}><span><Copy size={14} aria-hidden="true" /> Copiar teléfono</span><span><Phone size={14} aria-hidden="true" /> Llamar</span><span><MapPin size={14} aria-hidden="true" /> Abrir Maps*</span></div>
    <p className={styles.note}>El negocio abre WhatsApp y envía el mensaje.<br />*Maps y dirección están disponibles cuando corresponde.</p>
  </div>;
}
