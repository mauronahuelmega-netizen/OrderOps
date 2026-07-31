"use client";

import type { PublicCustomizationOption } from "@/lib/product-customization/public-shared";
import { formatPublicCatalogCurrency } from "@/lib/product-customization/public-shared";
import styles from "./customization-shared.module.css";

type Props = {
  groupId: string;
  selectionType: "single" | "multiple";
  option: PublicCustomizationOption;
  checked: boolean;
  disabled?: boolean;
  compact?: boolean;
  onSelect: (optionId: string) => void;
};

export default function CustomizationOptionRow({
  groupId,
  selectionType,
  option,
  checked,
  disabled = false,
  compact = false,
  onSelect
}: Props) {
  const inputId = `${groupId}-${option.id}`;
  const rowClass = [
    styles.optionRow,
    compact ? styles.optionRowCompact : "",
    checked ? styles.optionRowSelected : "",
    disabled ? styles.optionRowDisabled : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li>
      <label htmlFor={inputId} className={rowClass}>
        <input
          id={inputId}
          type={selectionType === "single" ? "radio" : "checkbox"}
          name={selectionType === "single" ? `group-${groupId}` : undefined}
          checked={checked}
          disabled={disabled}
          onChange={() => {
            if (disabled) {
              return;
            }
            onSelect(option.id);
          }}
        />
        <span className={styles.optionCopy}>
          <strong>{option.name}</strong>
          {option.description ? <small>{option.description}</small> : null}
        </span>
        {option.priceDelta > 0 ? (
          <span className={styles.optionDelta}>
            +{formatPublicCatalogCurrency(option.priceDelta)}
          </span>
        ) : null}
      </label>
    </li>
  );
}
