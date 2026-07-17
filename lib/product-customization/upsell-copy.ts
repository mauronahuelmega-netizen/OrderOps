/**
 * Customer-facing copy for public Plus / suggested-add sections.
 * Does not change DB names (e.g. "Bebidas") — only presentation labels.
 */

export type UpsellGroupCopy = {
  title: string;
  description: string;
};

/** Short label used above associated upsell lines in cart / checkout. */
export const UPSELL_ASSOCIATED_LABEL = "Adicional";

export function getUpsellGroupCopy(groupName: string): UpsellGroupCopy {
  const normalized = groupName.trim().toLowerCase();

  if (normalized.includes("bebida")) {
    return {
      title: "Sumá una bebida",
      description: "Agregá una bebida a tu pedido."
    };
  }

  return {
    title: "También podés sumar",
    description: "Agregá un adicional a tu pedido."
  };
}

export function formatUpsellOptionPrice(price: number, formatCurrency: (value: number) => string) {
  return `+${formatCurrency(price)}`;
}

export function formatUpsellAssociatedLine(
  productName: string,
  price: number,
  formatCurrency: (value: number) => string
) {
  return `${productName} ${formatUpsellOptionPrice(price, formatCurrency)}`;
}
