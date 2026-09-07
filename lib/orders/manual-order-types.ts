import type {
  CheckoutCustomizedGroupPayload
} from "@/lib/product-customization/order-types";
import type {
  PublicCustomizationGroup,
  PublicUpsellGroupView
} from "@/lib/product-customization/public-shared";

export type ManualOrderProductCustomizationConfig = {
  productId: string;
  productName: string;
  productPrice: number;
  groups: PublicCustomizationGroup[];
  upsellGroup: PublicUpsellGroupView | null;
};

export type ManualOrderProductOption = {
  id: string;
  name: string;
  price: number;
  categoryName?: string | null;
  isAvailable: boolean;
  /**
   * False when the product would open the public customization modal.
   * Quick-add is forbidden; configure via admin picker instead.
   */
  isManualOrderAvailable: boolean;
  /** Short admin-facing reason when not available for simple quick-add. */
  manualOrderUnavailableReason: string | null;
  /** Present when the product requires configuration (picker UI). */
  customizationConfig?: ManualOrderProductCustomizationConfig | null;
};

/**
 * Server-safe create input lines. Client may send selection intent only —
 * never trust client unitPrice / snapshot / tenant.
 */
export type ManualOrderCreateTicketLineInput =
  | {
      kind: "simple";
      clientLineId: string;
      productId: string;
      quantity: number;
    }
  | {
      kind: "customized";
      clientLineId: string;
      productId: string;
      quantity: number;
      selectedGroups: CheckoutCustomizedGroupPayload[];
      configurationSignature: string;
    }
  | {
      kind: "upsell";
      clientLineId: string;
      productId: string;
      quantity: number;
      parentClientLineId: string;
    };
