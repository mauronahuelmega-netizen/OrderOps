"use client";

import { buildAdminPresenceInitials } from "@/components/admin/orders/use-admin-presence";
import styles from "./operator-presence-pill.module.css";

type OperatorPresencePillProps = {
  label: string;
  names?: string[];
  ariaLabel?: string;
  tone?: "global" | "contextual";
};

export default function OperatorPresencePill({
  label,
  names = [],
  ariaLabel,
  tone = "global"
}: OperatorPresencePillProps) {
  const visibleNames = names.slice(0, 3);

  const rootClassName = [
    styles["admin-orders-presence-indicator"],
    tone === "contextual" ? styles["admin-orders-presence-indicator--contextual"] : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      aria-label={ariaLabel ?? label}
      title={visibleNames.length > 0 ? visibleNames.join(", ") : undefined}
    >
      <span className={styles["admin-orders-presence-indicator__dot"]} aria-hidden="true" />
      <span className={styles["admin-orders-presence-indicator__label"]}>{label}</span>
      {visibleNames.length > 0 ? (
        <span className={styles["admin-orders-presence-indicator__avatars"]} aria-hidden="true">
          {visibleNames.map((name) => (
            <span key={name} className={styles["admin-orders-presence-indicator__avatar"]}>
              {buildAdminPresenceInitials(name)}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}
