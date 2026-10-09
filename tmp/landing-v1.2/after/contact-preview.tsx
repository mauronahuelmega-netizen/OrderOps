import { Copy, MessageCircle, Phone, Send, ChevronDown } from "lucide-react";
import { illustrativeOrder } from "./marketing-content";
import styles from "./contact-preview.module.css";

export default function ContactPreview() {
  return <div className={styles.contact}>
    <div className={styles.header}><span><MessageCircle size={18} aria-hidden="true" /> Contacto con el cliente</span><strong>#{illustrativeOrder.reference}</strong></div>
    <div className={styles.selector}><span>Mensaje preparado</span><strong>Avisar preparación <ChevronDown size={16} aria-hidden="true" /></strong></div>
    <div className={styles.message}><p>Hola {illustrativeOrder.customer}</p><p>{illustrativeOrder.message}</p><span>Mensaje listo para abrir en WhatsApp</span></div>
    <div className={styles.openWhatsapp}><Send size={16} aria-hidden="true" /> Abrir WhatsApp</div>
    <div className={styles.utilities}><span><Copy size={13} aria-hidden="true" /> Copiar resumen</span><span><Copy size={14} aria-hidden="true" /> Copiar teléfono</span><span><Phone size={14} aria-hidden="true" /> Llamar</span></div>
    <p className={styles.note}>Abrís WhatsApp y enviás el mensaje.</p>
  </div>;
}
