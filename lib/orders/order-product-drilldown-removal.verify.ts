import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildOrderPreparationItems } from "../product-customization/order-preparation";
import type { AdminOrderItem } from "./admin";

function verifySourceContracts() {
  const root = process.cwd();

  // 1. OrderProductModal file must NOT exist
  const modalPath = path.join(root, "components", "admin", "orders", "order-product-modal.tsx");
  assert.equal(
    fs.existsSync(modalPath),
    false,
    "Expected order-product-modal.tsx to be deleted"
  );

  // 2. Scan components/admin/orders/order-products-list.tsx
  const listPath = path.join(root, "components", "admin", "orders", "order-products-list.tsx");
  const listSource = fs.readFileSync(listPath, "utf8");
  assert.equal(
    listSource.includes("OrderProductModal"),
    false,
    "order-products-list.tsx must not import or use OrderProductModal"
  );
  assert.equal(
    listSource.includes("selectedItemId"),
    false,
    "order-products-list.tsx must not declare selectedItemId state"
  );
  assert.equal(
    listSource.includes("onSelectItem"),
    false,
    "order-products-list.tsx must not pass onSelectItem callback"
  );

  // 3. Scan components/admin/orders/order-preparation-items.tsx
  const prepPath = path.join(root, "components", "admin", "orders", "order-preparation-items.tsx");
  const prepSource = fs.readFileSync(prepPath, "utf8");
  assert.equal(
    prepSource.includes("onSelectItem"),
    false,
    "order-preparation-items.tsx must not accept or reference onSelectItem"
  );
  assert.equal(
    prepSource.includes("preparationProductButton"),
    false,
    "order-preparation-items.tsx must not use preparationProductButton"
  );
  assert.equal(
    prepSource.includes("preparationAdicionalButton"),
    false,
    "order-preparation-items.tsx must not use preparationAdicionalButton"
  );
  assert.equal(
    prepSource.includes("<button"),
    false,
    "order-preparation-items.tsx must not render button tags for product items"
  );

  // 4. Scan components/admin/orders/order-items.module.css
  const cssPath = path.join(root, "components", "admin", "orders", "order-items.module.css");
  const cssSource = fs.readFileSync(cssPath, "utf8");
  assert.equal(
    cssSource.includes(".preparationProductButton"),
    false,
    "order-items.module.css must not contain .preparationProductButton"
  );
  assert.equal(
    cssSource.includes(".preparationAdicionalButton"),
    false,
    "order-items.module.css must not contain .preparationAdicionalButton"
  );

  // 5. Scan components/admin/orders/order-detail-surfaces.module.css
  const detailCssPath = path.join(root, "components", "admin", "orders", "order-detail-surfaces.module.css");
  const detailCssSource = fs.readFileSync(detailCssPath, "utf8");
  assert.equal(
    detailCssSource.includes(".itemModalBackdrop"),
    false,
    "order-detail-surfaces.module.css must not contain .itemModalBackdrop"
  );
  assert.equal(
    detailCssSource.includes(".itemModalImage"),
    false,
    "order-detail-surfaces.module.css must not contain .itemModalImage"
  );
}

function verifyInlinePreparationDataIntegrity() {
  const sampleItems: any[] = [
    {
      id: "item-1",
      product_id: "prod-burger",
      product_name: "Hamburguesa Doble",
      quantity: 2,
      unit_price: 12000,
      customization_snapshot: {
        version: 2,
        source: "public_checkout",
        configuration_signature: "sig-123",
        product: { id: "prod-burger", name: "Hamburguesa Doble" },
        groups: [
          {
            group_id: "grp-cheese",
            group_name: "Quesos",
            selection_type: "single",
            allows_option_quantity: true,
            is_required: false,
            min_selections: 0,
            max_selections: 1,
            max_total_quantity: 1,
            sort_order: 0,
            selected_options: [
              {
                option_id: "opt-cheddar",
                option_name: "Cheddar",
                price_delta: 500,
                quantity: 1,
                quantity_per_unit: 1,
                operational_total: 2,
                sort_order: 0
              }
            ]
          }
        ],
        pricing: { base_price: 12000, options_total: 1000, unit_total: 12500 },
        summary: ["Quesos: Cheddar"]
      },
      description: "Carne premium y pan artesanal",
      image_url: null,
      item_kind: "product",
      parent_order_item_id: null
    },
    {
      id: "item-2",
      product_id: "prod-upsell-1",
      product_name: "Papas Fritas",
      quantity: 1,
      unit_price: 3500,
      parent_order_item_id: "item-1",
      item_kind: "upsell",
      customization_snapshot: null,
      description: null,
      image_url: null
    }
  ];

  const preparationItems = buildOrderPreparationItems(sampleItems);
  assert.equal(preparationItems.length, 1, "Should combine parent and child into 1 preparation root item");

  const root = preparationItems[0];
  assert.equal(root.name, "Hamburguesa Doble");
  assert.equal(root.quantity, 2);
  assert.equal(root.unitPrice, 12000);
  assert.equal(root.lineTotal, 24000);

  assert.equal(root.groups.length, 1);
  assert.equal(root.groups[0].name, "Quesos");
  assert.equal(root.groups[0].options[0].name, "Cheddar");
  assert.equal(root.groups[0].options[0].quantityPerUnit, 1);
  assert.equal(root.groups[0].options[0].operationalTotal, 2);

  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].name, "Papas Fritas");
  assert.equal(root.children[0].quantity, 1);
  assert.equal(root.children[0].unitPrice, 3500);
}

function run() {
  verifySourceContracts();
  verifyInlinePreparationDataIntegrity();
  console.log("PASS: order-product-drilldown-removal.verify.ts");
}

run();
