"use client";

import type { ReactNode } from "react";
import { formatPublicCatalogCurrency } from "@/lib/product-customization/public-shared";
import styles from "./customization-shared.module.css";

type Props = {
  total: number;
  label?: string;
  note?: string | null;
  incompleteHint?: string | null;
  confirmError?: string | null;
  /** When false, total row is hidden (e.g. public CTA embeds `Agregar · $X`). */
  showTotalRow?: boolean;
  children?: ReactNode;
};

export default function CustomizationPriceSummary({
  total,
  label = "Total",
  note = null,
  incompleteHint = null,
  confirmError = null,
  showTotalRow = true,
  children
}: Props) {
  return (
    <>
      {showTotalRow ? (
        <div className={styles.footerTotal}>
          <span>{label}</span>
          <strong>{formatPublicCatalogCurrency(total)}</strong>
        </div>
      ) : null}

      {note ? <p className={styles.footerNote}>{note}</p> : null}

      {confirmError ? (
        <p className={styles.groupError} role="alert">
          {confirmError}
        </p>
      ) : null}

      {incompleteHint ? <p className={styles.footerHint}>{incompleteHint}</p> : null}

      {children}
    </>
  );
}
