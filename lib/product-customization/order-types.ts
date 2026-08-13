/** Client-safe / shared order payload types for Product Customization ORDER-1 + qty V2. */

export type CheckoutLegacyItemPayload = {
  productId: string;
  quantity: number;
};

export type CheckoutSelectedOptionPayloadV2 = {
  optionId: string;
  quantity: number;
};

export type CheckoutCustomizedGroupPayload = {
  groupId: string;
  /** V2: option quantities. Preferred when present. */
  selectedOptions?: CheckoutSelectedOptionPayloadV2[];
  /** Legacy bridge: unique option IDs (implied quantity 1). */
  selectedOptionIds: string[];
};

export type CheckoutUpsellItemPayload = {
  cartLineId: string;
  productId: string;
  quantity: number;
  parentCartLineId: string;
};

export type CheckoutCustomizedItemPayload = {
  cartLineId: string;
  productId: string;
  quantity: number;
  configurationSignature: string;
  selectedGroups: CheckoutCustomizedGroupPayload[];
  upsellItems: CheckoutUpsellItemPayload[];
};

export type CheckoutCartPayload = {
  legacyItems: CheckoutLegacyItemPayload[];
  customizedItems: CheckoutCustomizedItemPayload[];
};

export type CustomizationSnapshotV1 = {
  version: 1;
  source: "public_checkout";
  configuration_signature: string;
  product: {
    id: string;
    name: string;
  };
  groups: Array<{
    group_id: string;
    group_name: string;
    selection_type: "single" | "multiple";
    is_required: boolean;
    min_selections: number;
    max_selections: number | null;
    sort_order: number;
    selected_options: Array<{
      option_id: string;
      option_name: string;
      price_delta: number;
      sort_order: number;
    }>;
  }>;
  pricing: {
    base_unit_price: number;
    customization_total: number;
    final_unit_price: number;
  };
  summary: string[];
};

export type CustomizationSnapshotV2 = {
  version: 2;
  source: "public_checkout";
  configuration_signature: string;
  product: {
    id: string;
    name: string;
  };
  groups: Array<{
    group_id: string;
    group_name: string;
    selection_type: "single" | "multiple";
    allows_option_quantity: boolean;
    is_required: boolean;
    min_selections: number;
    max_selections: number | null;
    max_total_quantity: number | null;
    sort_order: number;
    selected_options: Array<{
      option_id: string;
      option_name: string;
      price_delta: number;
      quantity: number;
      total_price_delta: number;
      sort_order: number;
    }>;
  }>;
  pricing: {
    base_unit_price: number;
    customization_total: number;
    final_unit_price: number;
  };
  summary: string[];
};

export type CustomizationSnapshot = CustomizationSnapshotV1 | CustomizationSnapshotV2;

/** Safe RPC item after server validation. */
export type ValidatedCreateOrderRpcItem =
  | {
      client_line_id: string;
      product_id: string;
      quantity: number;
      item_kind: "product";
      customization_snapshot: CustomizationSnapshot | null;
      /** Final unit price for customized parents; omitted for legacy (RPC uses products.price). */
      unit_price?: number;
    }
  | {
      client_line_id: string;
      product_id: string;
      quantity: number;
      item_kind: "upsell";
      parent_client_line_id: string;
      customization_snapshot: null;
    };
