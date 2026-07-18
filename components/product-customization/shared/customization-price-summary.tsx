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
  children?: ReactNode;
};

export default function CustomizationPriceSummary({
  total,
  label = "Total",
  note = null,
  incompleteHint = null,
  confirmError = null,
  children
}: Props) {
  return (
    <>
      <div className={styles.footerTotal}>
        <span>{label}</span>
        <strong>{formatPublicCatalogCurrency(total)}</strong>
      </div>

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
