"use client";

import type { PreparationGroup, PreparationOption, PreparationOrderItem } from "@/lib/product-customization/order-preparation";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import styles from "./order-items.module.css";

type OrderPreparationItemsProps = {
  items: PreparationOrderItem[];
  dense?: boolean;
};

type OptionPerUnitDisplay =
  | { quantity: number; showCu: true }
  | { quantity: number; simple: true }
  | null;

type OptionTotalDisplay =
  | { kind: "operational"; quantity: number }
  | { kind: "ambas" }
  | { kind: "standard"; quantity: number }
  | null;

type OptionDisplay = {
  name: string;
  perUnit: OptionPerUnitDisplay;
  total: OptionTotalDisplay;
};

function formatStandardCoverage(parentQuantity: number): OptionTotalDisplay {
  if (parentQuantity <= 1) {
    return null;
  }

  if (parentQuantity === 2) {
    return { kind: "ambas" };
  }

  return { kind: "standard", quantity: parentQuantity };
}

function formatOptionDisplay(
  option: PreparationOption,
  parentQuantity: number
): OptionDisplay {
  const { name, isQuantityEnabled, quantityPerUnit, operationalTotal } = option;

  if (isQuantityEnabled) {
    if (parentQuantity > 1 && quantityPerUnit !== undefined) {
      return {
        name,
        perUnit: { quantity: quantityPerUnit, showCu: true },
        total:
          operationalTotal !== undefined
            ? { kind: "operational", quantity: operationalTotal }
            : null
      };
    }

    if (quantityPerUnit !== undefined && quantityPerUnit > 1) {
      return {
        name,
        perUnit: { quantity: quantityPerUnit, simple: true },
        total: null
      };
    }

    return { name, perUnit: null, total: null };
  }

  return {
    name,
    perUnit: null,
    total: formatStandardCoverage(parentQuantity)
  };
}

function PreparationOptionPerUnit({ perUnit }: { perUnit: OptionPerUnitDisplay }) {
  if (!perUnit) {
    return <span className={styles.preparationOptionPerUnit} aria-hidden="true" />;
  }

  if ("simple" in perUnit) {
    return (
      <span className={styles.preparationOptionPerUnit}>
        ×<span className={styles.preparationNumeric}>{perUnit.quantity}</span>
      </span>
    );
  }

  return (
    <span className={styles.preparationOptionPerUnit}>
      ×<span className={styles.preparationNumeric}>{perUnit.quantity}</span> c/u
    </span>
  );
}

function PreparationOptionTotal({ total }: { total: OptionTotalDisplay }) {
  if (!total) {
    return <span className={styles.preparationOptionTotal} aria-hidden="true" />;
  }

  if (total.kind === "ambas") {
    return <span className={styles.preparationOptionTotal}>Ambas</span>;
  }

  return (
    <span className={styles.preparationOptionTotal}>
      <span className={styles.preparationNumeric}>{total.quantity}</span> total
    </span>
  );
}

function PreparationOptionRow({
  option,
  parentQuantity
}: {
  option: PreparationOption;
  parentQuantity: number;
}) {
  const { name, perUnit, total } = formatOptionDisplay(option, parentQuantity);
  const isQuantityEnabledRow = Boolean(perUnit && total);

  return (
    <li
      className={[
        styles.preparationOption,
        isQuantityEnabledRow ? styles.preparationOptionQuantityEnabled : null
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.preparationOptionName}>{name}</span>
      <PreparationOptionPerUnit perUnit={perUnit} />
      <PreparationOptionTotal total={total} />
    </li>
  );
}

function PreparationGroupBlock({
  group,
  parentQuantity
}: {
  group: PreparationGroup;
  parentQuantity: number;
}) {
  return (
    <div className={styles.preparationGroup}>
      <p className={styles.preparationGroupName}>{group.name}</p>
      <ul className={styles.preparationOptions}>
        {group.options.map((option) => (
          <PreparationOptionRow
            key={option.id || `${group.id}-${option.sortOrder}`}
            option={option}
            parentQuantity={parentQuantity}
          />
        ))}
      </ul>
    </div>
  );
}

function LegacyModifiers({ modifiers }: { modifiers: string[] }) {
  return (
    <div className={styles["admin-item-modifiers"]}>
      {modifiers.map((modifier, index) => (
        <span key={`${modifier}-${index}`} className={styles["admin-item-modifier"]}>
          {modifier}
        </span>
      ))}
    </div>
  );
}

function PreparationAdicionalBlock({
  children
}: {
  children: PreparationOrderItem[];
}) {
  if (children.length === 0) {
    return null;
  }

  return (
    <div className={styles.preparationAdicional}>
      <p className={styles.preparationAdicionalLabel}>Adicional</p>
      <ul className={styles.preparationAdicionalList}>
        {children.map((child) => (
          <li key={child.id} className={styles.preparationAdicionalRow}>
            <span className={styles.preparationAdicionalName}>
              {child.name} ×{child.quantity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductHeader({
  item
}: {
  item: PreparationOrderItem;
}) {
  const showUnitPrice = item.quantity > 1;
  const headerClassName = [
    styles.preparationProductHeader,
    showUnitPrice ? styles.preparationProductHeaderMulti : styles.preparationProductHeaderSingle
  ].join(" ");

  const content = (
    <>
      <h3 className={styles.preparationProductTitle}>
        <span className={styles.preparationProductQuantity}>{item.quantity}×</span>
        <span>{item.name}</span>
      </h3>
      {showUnitPrice ? (
        <span className={styles.preparationUnitPrice}>
          {formatAdminOrderCurrency(item.unitPrice)} c/u
        </span>
      ) : null}
      <strong className={styles.preparationLineTotal}>
        {formatAdminOrderCurrency(item.lineTotal)}
      </strong>
    </>
  );

  return <div className={[styles.preparationProductRow, headerClassName].join(" ")}>{content}</div>;
}

function PreparationProductBlock({
  item,
  dense
}: {
  item: PreparationOrderItem;
  dense?: boolean;
}) {
  const isOrphanUpsell = item.isOrphanUpsell || item.kind === "upsell";
  const hasGroups = item.groups.length > 0;
  const hasChildren = item.children.length > 0;
  const hasBody = hasGroups || hasChildren;
  const showLegacyModifiers =
    dense && !hasGroups && item.legacyModifiers && item.legacyModifiers.length > 0;
  const productClassName = [
    styles.preparationProduct,
    hasBody ? styles.preparationProductWithBody : styles.preparationProductSimple,
    isOrphanUpsell ? styles.preparationProductOrphan : null
  ]
    .filter(Boolean)
    .join(" ");

  if (isOrphanUpsell) {
    return (
      <div className={productClassName}>
        <div className={styles.preparationProductRow}>
          <div className={styles.preparationProductMain}>
            <p className={styles.preparationAdicionalLabel}>Adicional</p>
            <h3 className={styles.preparationProductTitle}>
              {item.name} ×{item.quantity}
            </h3>
          </div>
          <strong className={styles.preparationLineTotal}>
            {formatAdminOrderCurrency(item.lineTotal)}
          </strong>
        </div>
      </div>
    );
  }

  return (
    <div className={productClassName}>
      <ProductHeader item={item} />

      {hasBody ? (
        <div className={styles.preparationBody}>
          {hasGroups ? (
            <div className={styles.preparationGroups}>
              {item.groups.map((group) => (
                <PreparationGroupBlock
                  key={group.id || group.name}
                  group={group}
                  parentQuantity={item.quantity}
                />
              ))}
            </div>
          ) : null}

          {hasChildren ? (
            <PreparationAdicionalBlock children={item.children} />
          ) : null}
        </div>
      ) : showLegacyModifiers ? (
        <LegacyModifiers modifiers={item.legacyModifiers ?? []} />
      ) : null}
    </div>
  );
}

export default function OrderPreparationItems({
  items,
  dense
}: OrderPreparationItemsProps) {
  return (
    <div className={styles.preparationList}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={[
            styles.preparationEntry,
            index > 0 ? styles.preparationEntryFollow : null
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <PreparationProductBlock item={item} dense={dense} />
        </div>
      ))}
    </div>
  );
}
