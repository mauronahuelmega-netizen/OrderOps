import { ArrowUpRight, MessageCircle } from "lucide-react";
import { getMarketingContactUrl } from "./marketing-config";
import styles from "./marketing-landing.module.css";

type Props = { kind?: "demo" | "whatsapp"; location: string; compact?: boolean };

export default function MarketingAction({ kind = "demo", location, compact = false }: Props) {
  const href = getMarketingContactUrl(kind);
  const label = kind === "demo" ? "Solicitar demo" : "Hablar por WhatsApp";
  const className = [styles.action, kind === "whatsapp" ? styles.secondaryAction : "", compact ? styles.compactAction : ""].filter(Boolean).join(" ");
  const icon = kind === "demo" ? <ArrowUpRight size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />;
  const attributes = { "data-marketing-event": `${kind === "demo" ? "demo" : "whatsapp"}_cta_click`, "data-location": location };
  if (!href) return <button type="button" disabled className={className} aria-describedby="commercial-contact-note" {...attributes}>{label}{icon}</button>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...attributes}>{label}{icon}<span className={styles.srOnly}> (abre WhatsApp en otra pestaña)</span></a>;
}
