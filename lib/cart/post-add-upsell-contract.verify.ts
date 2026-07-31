/**
 * Pure fixtures for PUBLIC-CATALOG-POST-ADD-UPSELL-CART-CONTRACT-1.
 * Run: npx tsx lib/cart/post-add-upsell-contract.verify.ts
 */

import assert from "node:assert/strict";
import {
  attachUpsellChildToParent,
  buildCartLinesFromCustomizationSelection,
  buildUpsellChildCartLine,
  getCartItemCount,
  getCartItemsTotal,
  mergeCustomizedSelectionIntoCart,
  removeCartLineWithChildren,
  removeSingleCartLine,
  setV2ParentQuantity,
  type LocalCartItem,
  type LocalCartItemV2
} from "@/lib/cart/local";
import {
  buildCartConfigurationSignatureWithUpsell,
  buildParentConfigurationSignature
} from "@/lib/cart/signature";
import type {
  PublicProductCustomizationConfig,
  PublicUpsellSuggestedProduct
} from "@/lib/product-customization/public-shared";

function section(name: string) {
  console.log(`\n✓ ${name}`);
}

const coca: PublicUpsellSuggestedProduct = {
  id: "upsell-coca",
  name: "Coca Cola 500ml",
  price: 3000,
  imageUrl: null
};

const sprite: PublicUpsellSuggestedProduct = {
  id: "upsell-sprite",
  name: "Sprite 500ml",
  price: 2800,
  imageUrl: null
};

function baseConfig(
  overrides?: Partial<PublicProductCustomizationConfig>
): PublicProductCustomizationConfig {
  return {
    productId: "burger-1",
    productName: "Doble Smash",
    productPrice: 12500,
    productImageUrl: null,
    productDescription: null,
    groups: [
      {
        id: "g-papas",
        name: "Papas",
        description: null,
        selectionType: "single",
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "opt-grandes",
            name: "Papas grandes",
            description: null,
            priceDelta: 1500
          }
        ],
        isBlocked: false
      }
    ],
    upsellGroup: {
      id: "ug-modal",
      name: "Plus",
      description: null,
      products: [coca, sprite]
    },
    ...overrides
  };
}

function buildBurger(params?: {
  upsellIds?: string[];
  quantity?: number;
  optionId?: string;
}) {
  return buildCartLinesFromCustomizationSelection({
    config: baseConfig(),
    categoryId: "cat-1",
    selectedOptionsByGroupId: {
      "g-papas": [params?.optionId ?? "opt-grandes"]
    },
    selectedUpsellProductIds: params?.upsellIds ?? [],
    quantity: params?.quantity ?? 1
  });
}

section("merge created / merged / replaced / failures");

{
  const { parent, children } = buildBurger();
  const created = mergeCustomizedSelectionIntoCart([], parent, children);
  assert.equal(created.outcome, "created");
  if (created.outcome === "created") {
    assert.equal(created.parentCartLineId, parent.cartLineId);
    assert.equal(getCartItemCount(created.items), 1);
  }

  const again = buildBurger();
  const merged = mergeCustomizedSelectionIntoCart(
    created.items,
    again.parent,
    again.children
  );
  assert.equal(merged.outcome, "merged");
  if (merged.outcome === "merged") {
    assert.equal(merged.parentCartLineId, created.parentCartLineId);
    assert.equal(getCartItemCount(merged.items), 2);
  }

  const edit = buildBurger({ upsellIds: ["upsell-coca"] });
  const replaced = mergeCustomizedSelectionIntoCart(
    created.items,
    edit.parent,
    edit.children,
    {
      replaceCartLineId: created.parentCartLineId,
      eligibleAttachedUpsellProductIds: new Set()
    }
  );
  assert.equal(replaced.outcome, "replaced");
  if (replaced.outcome === "replaced") {
    assert.equal(replaced.parentCartLineId, created.parentCartLineId);
  }

  const missing = mergeCustomizedSelectionIntoCart(
    created.items,
    edit.parent,
    edit.children,
    { replaceCartLineId: "missing-id" }
  );
  assert.equal(missing.outcome, "parent_missing");
  assert.deepEqual(missing.items, created.items);
}

section("edit signature conflict does not mutate");

{
  const a = buildBurger({ upsellIds: ["upsell-coca"] });
  const b = buildBurger();
  let items: LocalCartItem[] = [];
  const createdA = mergeCustomizedSelectionIntoCart(items, a.parent, a.children);
  assert.equal(createdA.outcome, "created");
  items = createdA.items;
  // Force B to a distinct provisional id then create
  const createdB = mergeCustomizedSelectionIntoCart(
    items,
    {
      ...b.parent,
      // different signature without upsell
      configurationSignature: buildParentConfigurationSignature({
        productId: b.parent.productId,
        selectedGroups: b.parent.selectedGroups,
        upsellProductIds: []
      })
    },
    []
  );
  // Same product+options without upsell may merge with... wait A has coca so different.
  // Create B without upsell — signature differs from A.
  assert.equal(createdB.outcome, "created");
  items = createdB.items;
  assert.equal(getCartItemCount(items), 2);

  // Edit B to add Coca → would match A signature → conflict
  const editB = buildBurger({ upsellIds: ["upsell-coca"] });
  const conflict = mergeCustomizedSelectionIntoCart(
    items,
    editB.parent,
    editB.children,
    {
      replaceCartLineId: createdB.parentCartLineId,
      eligibleAttachedUpsellProductIds: new Set()
    }
  );
  assert.equal(conflict.outcome, "signature_conflict");
  assert.deepEqual(conflict.items, items);
  assert.equal(getCartItemCount(conflict.items), 2);
  assert.equal(getCartItemsTotal(conflict.items), getCartItemsTotal(items));
}

section("attach / idempotency / parent validation");

{
  const { parent, children } = buildBurger();
  const created = mergeCustomizedSelectionIntoCart([], parent, children);
  assert.equal(created.outcome, "created");
  const parentId = created.parentCartLineId;

  const attached = attachUpsellChildToParent({
    items: created.items,
    parentCartLineId: parentId,
    suggestedProduct: coca
  });
  assert.equal(attached.outcome, "attached");
  if (attached.outcome !== "attached") {
    throw new Error("expected attached");
  }
  assert.equal(getCartItemCount(attached.items), 1);
  assert.equal(
    getCartItemsTotal(attached.items),
    getCartItemsTotal(created.items) + coca.price
  );

  const again = attachUpsellChildToParent({
    items: attached.items,
    parentCartLineId: parentId,
    suggestedProduct: coca
  });
  assert.equal(again.outcome, "already_attached");
  assert.equal(getCartItemsTotal(again.items), getCartItemsTotal(attached.items));

  const missing = attachUpsellChildToParent({
    items: attached.items,
    parentCartLineId: "nope",
    suggestedProduct: coca
  });
  assert.equal(missing.outcome, "parent_missing");

  const legacyOnly: LocalCartItem[] = [
    {
      productId: "legacy",
      categoryId: "c",
      name: "X",
      description: null,
      imageUrl: null,
      price: 100,
      quantity: 1
    }
  ];
  assert.equal(
    attachUpsellChildToParent({
      items: legacyOnly,
      parentCartLineId: "x",
      suggestedProduct: coca
    }).outcome,
    "parent_missing"
  );

  const childId = (attached.items.find(
    (item) =>
      "itemKind" in item &&
      item.itemKind === "upsell" &&
      item.productId === coca.id
  ) as LocalCartItemV2).cartLineId;

  assert.equal(
    attachUpsellChildToParent({
      items: attached.items,
      parentCartLineId: childId,
      suggestedProduct: sprite
    }).outcome,
    "parent_missing"
  );

  const self = attachUpsellChildToParent({
    items: attached.items,
    parentCartLineId: parentId,
    suggestedProduct: {
      id: parent.productId,
      name: "Self",
      price: 1,
      imageUrl: null
    }
  });
  assert.equal(self.outcome, "already_attached");
}

section("attach signature conflict");

{
  const withCoca = buildBurger({ upsellIds: ["upsell-coca"] });
  const bare = buildBurger();
  let items = mergeCustomizedSelectionIntoCart([], withCoca.parent, withCoca.children)
    .items;
  items = mergeCustomizedSelectionIntoCart(items, bare.parent, bare.children).items;
  assert.equal(getCartItemCount(items), 2);

  const bareParent = items.find(
    (item) =>
      "itemKind" in item &&
      item.itemKind === "product" &&
      item.cartLineId !== withCoca.parent.cartLineId &&
      !item.configurationSignature.includes("upsell-coca")
  ) as LocalCartItemV2;

  const conflict = attachUpsellChildToParent({
    items,
    parentCartLineId: bareParent.cartLineId,
    suggestedProduct: coca
  });
  assert.equal(conflict.outcome, "signature_conflict");
  assert.deepEqual(conflict.items, items);
}

section("quantity / count / total");

{
  const { parent, children } = buildBurger({ quantity: 3 });
  const created = mergeCustomizedSelectionIntoCart([], parent, children);
  const attached = attachUpsellChildToParent({
    items: created.items,
    parentCartLineId: created.parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(attached.outcome, "attached");
  if (attached.outcome !== "attached") throw new Error("attach");
  const child = attached.items.find(
    (item) => "itemKind" in item && item.itemKind === "upsell"
  ) as LocalCartItemV2;
  assert.equal(child.quantity, 3);
  assert.equal(child.lineTotal, coca.price * 3);
  assert.equal(getCartItemCount(attached.items), 3);

  const scaled = setV2ParentQuantity(attached.items, created.parentCartLineId, 2);
  const scaledChild = scaled.find(
    (item) => "itemKind" in item && item.itemKind === "upsell"
  ) as LocalCartItemV2;
  assert.equal(scaledChild.quantity, 2);
  assert.equal(getCartItemCount(scaled), 2);
}

section("edit preservation");

{
  const { parent, children } = buildBurger();
  let items = mergeCustomizedSelectionIntoCart([], parent, children).items;
  const parentId = (items.find(
    (item) => "itemKind" in item && item.itemKind === "product"
  ) as LocalCartItemV2).cartLineId;

  items = attachUpsellChildToParent({
    items,
    parentCartLineId: parentId,
    suggestedProduct: coca
  }).items;

  const edit = buildBurger({ upsellIds: ["upsell-sprite"] });
  const replaced = mergeCustomizedSelectionIntoCart(
    items,
    edit.parent,
    edit.children,
    {
      replaceCartLineId: parentId,
      eligibleAttachedUpsellProductIds: new Set([coca.id])
    }
  );
  assert.equal(replaced.outcome, "replaced");
  if (replaced.outcome !== "replaced") throw new Error("replaced");

  const kids = replaced.items.filter(
    (item): item is LocalCartItemV2 =>
      "itemKind" in item && item.itemKind === "upsell"
  );
  assert.equal(kids.length, 2);
  assert.ok(kids.some((k) => k.productId === coca.id));
  assert.ok(kids.some((k) => k.productId === sprite.id));

  const sig = (replaced.items.find(
    (item) => "cartLineId" in item && item.cartLineId === parentId
  ) as LocalCartItemV2).configurationSignature;
  assert.ok(sig.includes(coca.id));
  assert.ok(sig.includes(sprite.id));

  // Invalid post-add product not in eligible set is dropped
  const dropped = mergeCustomizedSelectionIntoCart(
    items,
    edit.parent,
    edit.children,
    {
      replaceCartLineId: parentId,
      eligibleAttachedUpsellProductIds: new Set()
    }
  );
  assert.equal(dropped.outcome, "replaced");
  if (dropped.outcome === "replaced") {
    const remaining = dropped.items.filter(
      (item) => "itemKind" in item && item.itemKind === "upsell"
    );
    assert.equal(remaining.length, 1);
    assert.equal((remaining[0] as LocalCartItemV2).productId, sprite.id);
  }
}

section("remove hierarchy");

{
  const { parent, children } = buildBurger();
  let items = mergeCustomizedSelectionIntoCart([], parent, children).items;
  items = attachUpsellChildToParent({
    items,
    parentCartLineId: parent.cartLineId,
    suggestedProduct: coca
  }).items;
  const child = items.find(
    (item) => "itemKind" in item && item.itemKind === "upsell"
  ) as LocalCartItemV2;

  const withoutChild = removeSingleCartLine(items, child.cartLineId);
  assert.equal(
    withoutChild.some((item) => "itemKind" in item && item.itemKind === "product"),
    true
  );
  assert.equal(
    withoutChild.some((item) => "itemKind" in item && item.itemKind === "upsell"),
    false
  );

  const parentAfterRemove = withoutChild.find(
    (item): item is LocalCartItemV2 =>
      "itemKind" in item && item.itemKind === "product"
  );
  assert.ok(parentAfterRemove);
  assert.equal(
    parentAfterRemove.configurationSignature,
    buildParentConfigurationSignature({
      productId: parent.productId,
      selectedGroups: parent.selectedGroups,
      upsellProductIds: []
    })
  );

  // Same customization can merge again after child removal.
  const again = buildBurger();
  const mergedAfterRemove = mergeCustomizedSelectionIntoCart(
    withoutChild,
    again.parent,
    again.children
  );
  assert.equal(mergedAfterRemove.outcome, "merged");
  assert.equal(
    mergedAfterRemove.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item && item.itemKind === "product"
    )?.quantity,
    2
  );

  const withoutParent = removeCartLineWithChildren(items, parent.cartLineId);
  assert.equal(withoutParent.length, 0);
}

section("child builder equivalence");

{
  const fromBuilder = buildCartLinesFromCustomizationSelection({
    config: baseConfig(),
    categoryId: "cat-1",
    selectedOptionsByGroupId: { "g-papas": ["opt-grandes"] },
    selectedUpsellProductIds: ["upsell-coca"],
    quantity: 2
  }).children[0]!;

  const fromAttach = buildUpsellChildCartLine({
    suggested: coca,
    parentCartLineId: "parent-x",
    categoryId: "cat-1",
    quantity: 2
  });

  assert.equal(fromBuilder.productId, fromAttach.productId);
  assert.equal(fromBuilder.productName, fromAttach.productName);
  assert.equal(fromBuilder.baseUnitPrice, fromAttach.baseUnitPrice);
  assert.equal(fromBuilder.finalUnitPrice, fromAttach.finalUnitPrice);
  assert.equal(fromBuilder.quantity, fromAttach.quantity);
  assert.equal(fromBuilder.lineTotal, fromAttach.lineTotal);
  assert.equal(fromBuilder.itemKind, fromAttach.itemKind);
  assert.deepEqual(fromBuilder.displaySummary, fromAttach.displaySummary);
}

section("hypothetical signature helper");

{
  const { parent } = buildBurger();
  const sig = buildCartConfigurationSignatureWithUpsell({
    parent,
    existingUpsellProductIds: [],
    additionalUpsellProductId: coca.id
  });
  const expected = buildParentConfigurationSignature({
    productId: parent.productId,
    selectedGroups: parent.selectedGroups,
    upsellProductIds: [coca.id]
  });
  assert.equal(sig, expected);
  // Order independence
  const sig2 = buildCartConfigurationSignatureWithUpsell({
    parent,
    existingUpsellProductIds: [sprite.id],
    additionalUpsellProductId: coca.id
  });
  const sig3 = buildParentConfigurationSignature({
    productId: parent.productId,
    selectedGroups: parent.selectedGroups,
    upsellProductIds: [coca.id, sprite.id]
  });
  assert.equal(sig2, sig3);
}

section("EDIT-QTY — replaced preserves root and child quantity");

{
  function editPreserveQty(existingQty: number) {
    const created = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: existingQty }).parent,
      []
    );
    assert.equal(created.outcome, "created");
    let items = created.items;
    items = attachUpsellChildToParent({
      items,
      parentCartLineId: created.parentCartLineId,
      suggestedProduct: coca
    }).items;

    // Modal rebuild always emits quantity 1 — replace must ignore that.
    const editPayload = buildBurger({ optionId: "opt-grandes", quantity: 1 });
    const replaced = mergeCustomizedSelectionIntoCart(
      items,
      editPayload.parent,
      editPayload.children,
      {
        replaceCartLineId: created.parentCartLineId,
        eligibleAttachedUpsellProductIds: new Set([coca.id, sprite.id])
      }
    );
    assert.equal(replaced.outcome, "replaced");
    const parent = replaced.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item &&
        item.itemKind === "product" &&
        item.cartLineId === created.parentCartLineId
    );
    const child = replaced.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item &&
        item.itemKind === "upsell" &&
        item.productId === coca.id
    );
    assert.ok(parent);
    assert.ok(child);
    assert.equal(parent.quantity, existingQty);
    assert.equal(child.quantity, existingQty);
    assert.equal(parent.lineTotal, parent.finalUnitPrice * existingQty);
    assert.equal(child.lineTotal, coca.price * existingQty);
    assert.equal(getCartItemCount(replaced.items), existingQty);
    return { parent, child, items: replaced.items, parentId: created.parentCartLineId };
  }

  // EDIT-QTY-01 / 02 / 03 / 04 / 05 / 06 / 13 / 14
  editPreserveQty(1);
  editPreserveQty(2);
  const qty3 = editPreserveQty(3);
  assert.equal(qty3.parent.quantity, 3);
  assert.equal(qty3.child.quantity, 3);

  // EDIT-QTY-07 — invalid child dropped, parent qty preserved
  {
    const created = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 2 }).parent,
      []
    );
    let items = attachUpsellChildToParent({
      items: created.items,
      parentCartLineId: created.parentCartLineId,
      suggestedProduct: coca
    }).items;
    const editPayload = buildBurger({ quantity: 1 });
    const replaced = mergeCustomizedSelectionIntoCart(
      items,
      editPayload.parent,
      editPayload.children,
      {
        replaceCartLineId: created.parentCartLineId,
        eligibleAttachedUpsellProductIds: new Set() // coca ineligible → dropped
      }
    );
    assert.equal(replaced.outcome, "replaced");
    const parent = replaced.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item && item.itemKind === "product"
    )!;
    assert.equal(parent.quantity, 2);
    assert.equal(
      replaced.items.some(
        (item) => "itemKind" in item && item.itemKind === "upsell"
      ),
      false
    );
    assert.equal(getCartItemCount(replaced.items), 2);
  }

  // EDIT-QTY-08 — conflict atomic (qty unchanged)
  {
    const a = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 2, upsellIds: ["upsell-coca"] }).parent,
      buildBurger({ quantity: 2, upsellIds: ["upsell-coca"] }).children
    );
    assert.equal(a.outcome, "created");
    const bBare = buildBurger({ quantity: 1 });
    const b = mergeCustomizedSelectionIntoCart(a.items, bBare.parent, []);
    assert.equal(b.outcome, "created");
    const before = structuredClone(b.items);
    // Edit B (qty 1) toward A's config with coca → conflict; B stays qty 1, A stays 2
    const conflict = mergeCustomizedSelectionIntoCart(
      b.items,
      buildBurger({ quantity: 1, upsellIds: ["upsell-coca"] }).parent,
      buildBurger({ quantity: 1, upsellIds: ["upsell-coca"] }).children,
      {
        replaceCartLineId: b.parentCartLineId,
        eligibleAttachedUpsellProductIds: new Set([coca.id])
      }
    );
    assert.equal(conflict.outcome, "signature_conflict");
    assert.deepEqual(conflict.items, before);
    const aParent = conflict.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item &&
        item.itemKind === "product" &&
        item.cartLineId === a.parentCartLineId
    )!;
    assert.equal(aParent.quantity, 2);
  }

  // EDIT-QTY-09 — parent missing does not create qty-1 line
  {
    const created = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 2 }).parent,
      []
    );
    const snapshot = structuredClone(created.items);
    const missing = mergeCustomizedSelectionIntoCart(
      created.items,
      buildBurger({ quantity: 1 }).parent,
      [],
      { replaceCartLineId: "missing-parent" }
    );
    assert.equal(missing.outcome, "parent_missing");
    assert.deepEqual(missing.items, snapshot);
    assert.equal(getCartItemCount(missing.items), 2);
  }

  // EDIT-QTY-10 — created unaffected (qty 1 from modal)
  {
    const created = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 1 }).parent,
      []
    );
    assert.equal(created.outcome, "created");
    const parent = created.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item && item.itemKind === "product"
    )!;
    assert.equal(parent.quantity, 1);
  }

  // EDIT-QTY-11 — merged accumulates (2 + 1 = 3)
  {
    const first = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 2 }).parent,
      []
    );
    const second = mergeCustomizedSelectionIntoCart(
      first.items,
      buildBurger({ quantity: 1 }).parent,
      []
    );
    assert.equal(second.outcome, "merged");
    const parent = second.items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item && item.itemKind === "product"
    )!;
    assert.equal(parent.quantity, 3);
    assert.equal(getCartItemCount(second.items), 3);
  }

  // EDIT-QTY-12 — remove child rebuilds signature; parent qty unchanged
  {
    const created = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 2 }).parent,
      []
    );
    let items = attachUpsellChildToParent({
      items: created.items,
      parentCartLineId: created.parentCartLineId,
      suggestedProduct: coca
    }).items;
    const child = items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item && item.itemKind === "upsell"
    )!;
    items = removeSingleCartLine(items, child.cartLineId);
    const parent = items.find(
      (item): item is LocalCartItemV2 =>
        "itemKind" in item && item.itemKind === "product"
    )!;
    assert.equal(parent.quantity, 2);
    assert.equal(
      parent.configurationSignature,
      buildParentConfigurationSignature({
        productId: parent.productId,
        selectedGroups: parent.selectedGroups,
        upsellProductIds: []
      })
    );
    const merged = mergeCustomizedSelectionIntoCart(
      items,
      buildBurger({ quantity: 1 }).parent,
      []
    );
    assert.equal(merged.outcome, "merged");
    assert.equal(
      merged.items.find(
        (item): item is LocalCartItemV2 =>
          "itemKind" in item && item.itemKind === "product"
      )?.quantity,
      3
    );
  }

  // EDIT-QTY-15 — replaced outcome (post-add suppression belongs to overlay helper)
  {
    const created = mergeCustomizedSelectionIntoCart(
      [],
      buildBurger({ quantity: 2 }).parent,
      []
    );
    const replaced = mergeCustomizedSelectionIntoCart(
      created.items,
      buildBurger({ quantity: 1 }).parent,
      [],
      {
        replaceCartLineId: created.parentCartLineId,
        eligibleAttachedUpsellProductIds: new Set()
      }
    );
    assert.equal(replaced.outcome, "replaced");
    assert.notEqual(replaced.outcome, "created");
  }
}

console.log("\nALL_PASS post-add-upsell-contract.verify.ts\n");
