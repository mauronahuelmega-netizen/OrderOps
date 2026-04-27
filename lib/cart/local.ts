export type LocalCartItem = {
  productId: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

export function getCartStorageKey(businessId: string) {
  return `orderops-cart:${businessId}`;
}

export function parseLocalCartItems(value: string | null): LocalCartItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value) as LocalCartItem[];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item) =>
        typeof item.productId === "string" &&
        typeof item.categoryId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}
