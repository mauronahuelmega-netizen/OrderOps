"use client";

import {
  formatBuilderPrice,
  type BuilderProductRow
} from "@/lib/product-customization/builder-presentation";
import { formatCustomizationPriceDelta } from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type Props = {
  product: BuilderProductRow | null;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export default function CustomerPreviewPanel({
  product,
  collapsible = false,
  defaultOpen = true
}: Props) {
  const body = (
    <div className={styles.previewBody}>
      <p className={styles.previewNote}>Vista previa orientativa · no agrega al carrito</p>

      {!product ? (
        <p className={styles.previewEmpty}>
          Elegí un producto a la izquierda para ver un borrador de cómo podrían verse sus
          opciones.
        </p>
      ) : (
        <>
          <div className={styles.previewProductCard}>
            <p className={styles.previewProductName}>{product.name}</p>
            <p className={styles.previewProductPrice}>
              Desde {formatBuilderPrice(product.price)}
            </p>
          </div>

          <div className={styles.previewModalCard} aria-hidden={false}>
            <p className={styles.previewModalTitle}>Antes de agregar al carrito</p>

            {product.sections.length === 0 ? (
              <p className={styles.previewEmpty}>
                Todavía no hay secciones para mostrar. Cuando configures opciones, aparecerán
                acá.
              </p>
            ) : (
              product.sections.map((section) => (
                <div key={section.groupId} className={styles.previewSection}>
                  <p className={styles.previewSectionTitle}>{section.groupName}</p>
                  <ul className={styles.previewOptionList}>
                    {section.options.length === 0 ? (
                      <li className={styles.previewMuted}>Sin opciones todavía</li>
                    ) : (
                      section.options.slice(0, 4).map((option) => (
                        <li key={option.optionId} className={styles.previewOptionRow}>
                          <span className={styles.previewRadio} aria-hidden="true" />
                          <span>{option.optionName}</span>
                          {option.priceDelta !== 0 ? (
                            <span className={styles.previewDelta}>
                              {formatCustomizationPriceDelta(option.priceDelta)}
                            </span>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))
            )}

            {product.hasUpsell ? (
              <div className={styles.previewSection}>
                <p className={styles.previewSectionTitle}>También podés sumar</p>
                <p className={styles.previewMuted}>
                  {product.upsellLabel ?? "Venta sugerida configurada"}
                </p>
                <div className={styles.previewOptionRow}>
                  <span className={styles.previewCheck} aria-hidden="true" />
                  <span>Producto sugerido</span>
                </div>
              </div>
            ) : null}
          </div>

          <p className={styles.previewFoot}>
            Cuando actives la personalización, el cliente verá estas opciones en el modal del
            producto.
          </p>
        </>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <aside className={styles.previewPanel}>
        <div className={styles.previewHeader}>
          <h2 className={styles.panelTitle}>Así lo verá el cliente</h2>
          <p className={styles.panelSubtitle}>
            Borrador visual de la experiencia pública. No es el catálogo real.
          </p>
        </div>
        {body}
      </aside>
    );
  }

  return (
    <details className={styles.previewPanel} open={defaultOpen}>
      <summary className={styles.previewSummary}>
        <span className={styles.panelTitle}>Así lo verá el cliente</span>
        <span className={styles.panelSubtitleInline}>Vista previa orientativa</span>
      </summary>
      {body}
    </details>
  );
}
