"use client";

import type { PublicUpsellGroupView } from "@/lib/product-customization/public-shared";
import { formatPublicCatalogCurrency } from "@/lib/product-customization/public-shared";
import {
  formatUpsellOptionPrice,
  getUpsellGroupCopy
} from "@/lib/product-customization/upsell-copy";
import styles from "./customization-shared.module.css";

type Props = {
  upsellGroup: PublicUpsellGroupView;
  selectedProductIds: string[];
  onToggleProduct: (productId: string) => void;
};

export default function UpsellSuggestionGroup({
  upsellGroup,
  selectedProductIds,
  onToggleProduct
}: Props) {
  const copy = getUpsellGroupCopy(upsellGroup.name);

  return (
    <section className={styles.upsell}>
      <div className={styles.groupHeader}>
        <h3>{copy.title}</h3>
        <span className={styles.groupMeta}>Opcional</span>
      </div>
      <p className={styles.groupDescription}>{copy.description}</p>
      <ul className={styles.optionList}>
        {upsellGroup.products.map((product) => {
          const checked = selectedProductIds.includes(product.id);
          const inputId = `upsell-${product.id}`;
          const rowClass = [
            styles.optionRow,
            checked ? styles.optionRowSelected : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li key={product.id}>
              <label htmlFor={inputId} className={rowClass}>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleProduct(product.id)}
                />
                <span className={styles.optionCopy}>
                  <strong>{product.name}</strong>
                </span>
                <span className={styles.optionDelta}>
                  {formatUpsellOptionPrice(product.price, formatPublicCatalogCurrency)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
