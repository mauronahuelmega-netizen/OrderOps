"use client";

import { useId } from "react";
import {
  BRAND_PALETTE,
  getLegacyBrandColor,
  isPaletteColor,
  normalizeHexColor
} from "@/components/admin/settings/brand-palette";
import styles from "./brand-palette-control.module.css";

type BrandPaletteControlProps = {
  name: string;
  value: string;
  publishedValue: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function BrandPaletteControl({
  name,
  value,
  publishedValue,
  disabled = false,
  onChange
}: BrandPaletteControlProps) {
  const helperId = useId();
  const normalizedValue = normalizeHexColor(value);
  const publishedLegacy = getLegacyBrandColor(publishedValue);
  const currentLegacy =
    normalizedValue && !isPaletteColor(normalizedValue) ? normalizedValue : null;
  const legacyColor = currentLegacy ?? publishedLegacy;
  const showLegacyOption = Boolean(legacyColor);
  const hiddenValue = normalizedValue ?? "";

  function handleSelect(color: string) {
    const normalized = normalizeHexColor(color);

    if (normalized) {
      onChange(normalized);
    }
  }

  const isLegacySelected =
    Boolean(legacyColor) && normalizedValue === legacyColor;

  return (
    <div className={`${styles.control} admin-settings-brand-palette`}>
      <input type="hidden" name={name} value={hiddenValue} readOnly />

      <div className={styles.header}>
        <p className={styles.label}>Color de marca</p>
        <p className={styles.description} id={helperId}>
          Elegí un color para botones, etiquetas y detalles de tu landing pública.
        </p>
      </div>

      <div className={styles.grid} role="list" aria-describedby={helperId}>
        {showLegacyOption && legacyColor ? (
          <button
            type="button"
            role="listitem"
            className={`${styles.swatchCard} ${isLegacySelected ? styles.swatchCardActive : ""}`}
            disabled={disabled}
            aria-pressed={isLegacySelected}
            aria-label={`Color actual ${legacyColor}`}
            onClick={() => handleSelect(legacyColor)}
          >
            <span
              className={styles.swatch}
              style={{ backgroundColor: legacyColor }}
              aria-hidden="true"
            />
            <span className={styles.swatchCopy}>
              <strong>Color actual</strong>
              <span className={styles.legacyHex}>{legacyColor}</span>
            </span>
          </button>
        ) : null}

        {BRAND_PALETTE.map((entry) => {
          const isActive = normalizedValue === entry.value;

          return (
            <button
              key={entry.id}
              type="button"
              role="listitem"
              className={`${styles.swatchCard} ${isActive ? styles.swatchCardActive : ""}`}
              disabled={disabled}
              aria-pressed={isActive}
              aria-label={entry.label}
              onClick={() => handleSelect(entry.value)}
            >
              <span
                className={styles.swatch}
                style={{ backgroundColor: entry.value }}
                aria-hidden="true"
              />
              <span className={styles.swatchLabel}>{entry.label}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.helper}>
        Todos los colores fueron seleccionados para mantener buena lectura y una apariencia
        consistente.
      </p>

      {showLegacyOption ? (
        <p className={styles.legacyHelper}>
          Este color viene de una configuración anterior. Podés mantenerlo o elegir uno de la
          paleta segura.
        </p>
      ) : null}
    </div>
  );
}
