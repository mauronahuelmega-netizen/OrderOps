"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { createManualOrderAction } from "@/app/admin/(protected)/orders/actions";
import AdminOrderModalShell from "@/components/admin/orders/admin-order-modal-shell";
import ManualOrderCustomizationPanel, {
  createEmptyManualOrderCustomizationDraft,
  getManualOrderCustomizationDraftPreviewTotal,
  isManualOrderCustomizationDraftValid,
  type ManualOrderCustomizationDraft
} from "@/components/admin/orders/manual-order-customization-panel";
import Button from "@/components/ui/Button";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { manualTicketLinesToCreateInput } from "@/lib/orders/manual-order-customization-payload";
import {
  createManualConfiguredTicketBundle,
  createManualSimpleTicketLine,
  getManualTicketEstimatedTotal,
  mergeManualConfiguredSelection,
  mergeManualTicketLine,
  removeManualTicketLine,
  updateManualTicketLineQuantity,
  type ManualOrderTicketLine
} from "@/lib/orders/manual-order-customization-ticket";
import type { ManualOrderProductOption } from "@/lib/orders/manual-order-types";
import { buildSelectedGroupsFromConfig } from "@/lib/product-customization/order-snapshot";
import { UPSELL_ASSOCIATED_LABEL } from "@/lib/product-customization/upsell-copy";
import styles from "./manual-order-modal.module.css";

export type { ManualOrderProductOption } from "@/lib/orders/manual-order-types";

type DeliveryMethod = "delivery" | "pickup";

type ManualOrderModalView =
  | { type: "compose" }
  | { type: "configure"; productId: string };

type ManualOrderFieldErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
  items?: string;
};

export type ManualOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (order: AdminOrderDashboardItem) => void;
  onSessionMutationBlocked?: () => void;
  canCreateOrder: boolean;
  products: ManualOrderProductOption[];
  isProductsLoading?: boolean;
  productsError?: string | null;
  onRefreshProducts?: () => void;
};

const INITIAL_FORM_STATE = {
  customerName: "",
  phone: "",
  deliveryMethod: "pickup" as DeliveryMethod,
  address: "",
  notes: "",
  searchQuery: ""
};

export default function ManualOrderModal({
  isOpen,
  onClose,
  onCreated,
  onSessionMutationBlocked,
  canCreateOrder,
  products,
  isProductsLoading = false,
  productsError = null,
  onRefreshProducts
}: ManualOrderModalProps) {
  const [customerName, setCustomerName] = useState(INITIAL_FORM_STATE.customerName);
  const [phone, setPhone] = useState(INITIAL_FORM_STATE.phone);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    INITIAL_FORM_STATE.deliveryMethod
  );
  const [address, setAddress] = useState(INITIAL_FORM_STATE.address);
  const [notes, setNotes] = useState(INITIAL_FORM_STATE.notes);
  const [searchQuery, setSearchQuery] = useState(INITIAL_FORM_STATE.searchQuery);
  const [ticketLines, setTicketLines] = useState<ManualOrderTicketLine[]>([]);
  const [view, setView] = useState<ManualOrderModalView>({ type: "compose" });
  const [customizationDraft, setCustomizationDraft] =
    useState<ManualOrderCustomizationDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ManualOrderFieldErrors>({});
  const [isSubmitting, startSubmitTransition] = useTransition();
  const submitLockRef = useRef(false);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) => {
      const categoryName = product.categoryName?.toLowerCase() ?? "";

      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        categoryName.includes(normalizedQuery)
      );
    });
  }, [products, searchQuery]);

  const previewTotal = useMemo(
    () => getManualTicketEstimatedTotal(ticketLines),
    [ticketLines]
  );

  const hasSelectedItems = ticketLines.length > 0;
  const ticketSubmitReady = useMemo(() => {
    if (ticketLines.length === 0) {
      return false;
    }

    const byId = new Map(ticketLines.map((line) => [line.clientLineId, line]));

    for (const line of ticketLines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        return false;
      }

      if (line.kind === "customized") {
        if (!line.selectedGroups || line.selectedGroups.length === 0 || !line.signature) {
          return false;
        }
        continue;
      }

      if (line.kind === "upsell") {
        if (!line.parentClientLineId) {
          return false;
        }
        const parent = byId.get(line.parentClientLineId);
        if (!parent || parent.kind !== "customized") {
          return false;
        }
      }
    }

    return true;
  }, [ticketLines]);
  const canSubmit =
    canCreateOrder &&
    !isSubmitting &&
    products.length > 0 &&
    hasSelectedItems &&
    ticketSubmitReady;

  const rootTicketLines = useMemo(
    () => ticketLines.filter((line) => line.kind !== "upsell"),
    [ticketLines]
  );

  const selectedProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const line of ticketLines) {
      if (line.kind !== "upsell") {
        ids.add(line.productId);
      }
    }
    return ids;
  }, [ticketLines]);

  const configureProduct =
    view.type === "configure" ? productById.get(view.productId) ?? null : null;
  const configureConfig = configureProduct?.customizationConfig ?? null;
  const configureDraftValid =
    configureConfig && customizationDraft
      ? isManualOrderCustomizationDraftValid(configureConfig, customizationDraft)
      : false;
  const configurePreviewTotal =
    configureConfig && customizationDraft
      ? getManualOrderCustomizationDraftPreviewTotal(configureConfig, customizationDraft)
      : 0;

  const resetForm = useCallback(() => {
    setCustomerName(INITIAL_FORM_STATE.customerName);
    setPhone(INITIAL_FORM_STATE.phone);
    setDeliveryMethod(INITIAL_FORM_STATE.deliveryMethod);
    setAddress(INITIAL_FORM_STATE.address);
    setNotes(INITIAL_FORM_STATE.notes);
    setSearchQuery(INITIAL_FORM_STATE.searchQuery);
    setTicketLines([]);
    setView({ type: "compose" });
    setCustomizationDraft(null);
    setErrorMessage(null);
    setFieldErrors({});
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  const openConfigure = (productId: string) => {
    const product = productById.get(productId);
    if (!product?.customizationConfig) {
      setErrorMessage("No pudimos cargar la configuración de este producto.");
      return;
    }

    setErrorMessage(null);
    setCustomizationDraft(createEmptyManualOrderCustomizationDraft(productId));
    setView({ type: "configure", productId });
  };

  const cancelConfigure = () => {
    setCustomizationDraft(null);
    setView({ type: "compose" });
  };

  const confirmConfigure = () => {
    if (!configureProduct || !configureConfig || !customizationDraft) {
      return;
    }
    if (!isManualOrderCustomizationDraftValid(configureConfig, customizationDraft)) {
      return;
    }

    const selectedGroups = buildSelectedGroupsFromConfig(
      configureConfig.groups,
      {},
      customizationDraft.selection
    );
    const upsellById = new Map(
      (configureConfig.upsellGroup?.products ?? []).map((product) => [product.id, product])
    );
    const upsells = customizationDraft.selectedUpsellProductIds
      .map((productId) => upsellById.get(productId))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price
      }));

    const bundle = createManualConfiguredTicketBundle({
      productId: configureProduct.id,
      productName: configureProduct.name,
      categoryName: configureProduct.categoryName,
      baseUnitPrice: configureProduct.price,
      quantity: customizationDraft.quantity,
      selectedGroups,
      configGroups: configureConfig.groups,
      upsells
    });

    setTicketLines((current) => mergeManualConfiguredSelection(current, bundle));
    setFieldErrors((currentErrors) => ({ ...currentErrors, items: undefined }));
    setCustomizationDraft(null);
    setView({ type: "compose" });
  };

  const addProduct = (productId: string) => {
    const product = productById.get(productId);

    if (!product) {
      return;
    }

    // Customizable products must not quick-add as bare {productId, quantity}.
    if (!product.isManualOrderAvailable) {
      openConfigure(productId);
      return;
    }

    const simpleLine = createManualSimpleTicketLine({
      productId: product.id,
      productName: product.name,
      categoryName: product.categoryName,
      unitPrice: product.price,
      quantity: 1
    });
    setTicketLines((current) => mergeManualTicketLine(current, simpleLine));
    setFieldErrors((currentErrors) => ({ ...currentErrors, items: undefined }));
  };

  const updateLineQuantity = (clientLineId: string, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      setTicketLines((current) => removeManualTicketLine(current, clientLineId));
      return;
    }

    setTicketLines((current) =>
      updateManualTicketLineQuantity(current, clientLineId, nextQuantity)
    );
  };

  const removeLine = (clientLineId: string) => {
    setTicketLines((current) => removeManualTicketLine(current, clientLineId));
  };

  const validateForm = () => {
    const nextFieldErrors: ManualOrderFieldErrors = {};

    if (!customerName.trim()) {
      nextFieldErrors.customerName = "El nombre del cliente es obligatorio.";
    }

    if (!phone.trim()) {
      nextFieldErrors.phone = "El teléfono es obligatorio.";
    }

    if (deliveryMethod === "delivery" && !address.trim()) {
      nextFieldErrors.address = "La dirección es obligatoria para delivery.";
    }

    if (ticketLines.length === 0) {
      nextFieldErrors.items = "Agregá al menos un producto.";
    }

    for (const line of ticketLines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        nextFieldErrors.items = "La cantidad debe ser mayor a cero.";
        break;
      }

      if (line.kind === "customized") {
        if (!line.selectedGroups || line.selectedGroups.length === 0 || !line.signature) {
          nextFieldErrors.items =
            "Este producto requiere configuración antes de crear el pedido.";
          break;
        }
      }

      if (line.kind === "upsell") {
        const parent = ticketLines.find(
          (candidate) => candidate.clientLineId === line.parentClientLineId
        );
        if (!parent || parent.kind !== "customized") {
          nextFieldErrors.items =
            "Hay un adicional sin producto principal. Revisá el ticket.";
          break;
        }
      }
    }

    setFieldErrors(nextFieldErrors);

    return Object.keys(nextFieldErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || submitLockRef.current) {
      return;
    }

    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    const createInput = manualTicketLinesToCreateInput(ticketLines);
    if (!createInput.ok) {
      setFieldErrors((current) => ({
        ...current,
        items: createInput.error
      }));
      return;
    }

    // Never send customized products as legacy { productId, quantity } only.
    const hasBareSimpleCustomizable = createInput.ticketLines.some((line) => {
      if (line.kind !== "simple") {
        return false;
      }
      const product = productById.get(line.productId);
      return product ? !product.isManualOrderAvailable : false;
    });

    if (hasBareSimpleCustomizable) {
      setFieldErrors((current) => ({
        ...current,
        items: "Este producto requiere configuración antes de crear el pedido."
      }));
      return;
    }

    submitLockRef.current = true;

    startSubmitTransition(async () => {
      try {
        const result = await createManualOrderAction({
          customerName: customerName.trim(),
          phone: phone.trim(),
          deliveryMethod,
          address: deliveryMethod === "delivery" ? address.trim() : undefined,
          notes: notes.trim() ? notes.trim() : undefined,
          ticketLines: createInput.ticketLines
        });

        if (!result.ok) {
          setErrorMessage(result.error);

          if (result.code === "NO_ACTIVE_SESSION") {
            onSessionMutationBlocked?.();
          }

          return;
        }

        onCreated?.(result.order);
        resetForm();
        onClose();
      } finally {
        submitLockRef.current = false;
      }
    });
  };

  return (
    <AdminOrderModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo pedido"
      variant="workstation"
      headerLeading={
        <div className={styles["manual-order-modal__header-copy"]}>
          <h2>Nuevo pedido</h2>
          <p className={styles["manual-order-modal__subtitle"]}>
            Cargá un pedido tomado manualmente.
          </p>
        </div>
      }
      headerMeta={
        <span className={styles["manual-order-modal__header-badge"]}>Pedido manual</span>
      }
    >
      <form
        className={styles["manual-order-modal__form"]}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
      >
        <div className={styles["manual-order-modal__body"]}>
          {!canCreateOrder ? (
            <p
              className={`${styles["manual-order-modal__alert"]} ${styles["manual-order-modal__alert--info"]}`}
            >
              Abrí una sesión activa para crear pedidos.
            </p>
          ) : null}

          {productsError && products.length > 0 ? (
            <p
              className={`${styles["manual-order-modal__alert"]} ${styles["manual-order-modal__alert--warning"]}`}
              role="status"
            >
              No pudimos actualizar la lista de productos. Mostrando la última versión disponible.
            </p>
          ) : null}

          {isProductsLoading && products.length === 0 ? (
            <p
              className={`${styles["manual-order-modal__alert"]} ${styles["manual-order-modal__alert--loading"]}`}
              role="status"
            >
              Actualizando productos disponibles...
            </p>
          ) : null}

          {errorMessage ? (
            <p
              className={`${styles["manual-order-modal__alert"]} ${styles["manual-order-modal__alert--error"]}`}
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {view.type === "configure" && configureProduct && configureConfig && customizationDraft ? (
            <ManualOrderCustomizationPanel
              productName={configureProduct.name}
              config={configureConfig}
              draft={customizationDraft}
              onDraftChange={setCustomizationDraft}
              disabled={isSubmitting}
            />
          ) : (
            <>
              <section className={styles["manual-order-modal__customer-strip"]}>
                <h3 className={styles["manual-order-modal__section-title"]}>Cliente / Entrega</h3>
                <div className={styles["manual-order-modal__customer-grid"]}>
                  <label className={`admin-field ${styles["manual-order-modal__field"]}`}>
                    <span>Nombre del cliente *</span>
                    <input
                      type="text"
                      name="customer_name"
                      autoComplete="name"
                      value={customerName}
                      onChange={(event) => {
                        setCustomerName(event.target.value);
                        setFieldErrors((currentErrors) => ({
                          ...currentErrors,
                          customerName: undefined
                        }));
                      }}
                      aria-invalid={Boolean(fieldErrors.customerName)}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.customerName ? (
                      <p className={styles["manual-order-modal__field-error"]}>
                        {fieldErrors.customerName}
                      </p>
                    ) : null}
                  </label>

                  <label className={`admin-field ${styles["manual-order-modal__field"]}`}>
                    <span>Teléfono *</span>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setFieldErrors((currentErrors) => ({
                          ...currentErrors,
                          phone: undefined
                        }));
                      }}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.phone ? (
                      <p className={styles["manual-order-modal__field-error"]}>
                        {fieldErrors.phone}
                      </p>
                    ) : null}
                  </label>

                  <div className={styles["manual-order-modal__customer-grid-delivery"]}>
                    <div
                      className={styles["manual-order-modal__delivery-segment"]}
                      role="group"
                      aria-label="Método de entrega"
                    >
                      <div className={styles["manual-order-modal__delivery-options"]}>
                        <label className={styles["manual-order-modal__delivery-option"]}>
                          <input
                            type="radio"
                            name="delivery_method"
                            value="pickup"
                            checked={deliveryMethod === "pickup"}
                            onChange={() => setDeliveryMethod("pickup")}
                            disabled={isSubmitting}
                          />
                          Retiro
                        </label>
                        <label className={styles["manual-order-modal__delivery-option"]}>
                          <input
                            type="radio"
                            name="delivery_method"
                            value="delivery"
                            checked={deliveryMethod === "delivery"}
                            onChange={() => setDeliveryMethod("delivery")}
                            disabled={isSubmitting}
                          />
                          Delivery
                        </label>
                      </div>
                    </div>
                  </div>

                  {deliveryMethod === "delivery" ? (
                    <label
                      className={`admin-field ${styles["manual-order-modal__field"]} ${styles["manual-order-modal__customer-grid-address"]}`}
                    >
                      <span>Dirección de entrega *</span>
                      <input
                        type="text"
                        name="address"
                        autoComplete="street-address"
                        value={address}
                        onChange={(event) => {
                          setAddress(event.target.value);
                          setFieldErrors((currentErrors) => ({
                            ...currentErrors,
                            address: undefined
                          }));
                        }}
                        aria-invalid={Boolean(fieldErrors.address)}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.address ? (
                        <p className={styles["manual-order-modal__field-error"]}>
                          {fieldErrors.address}
                        </p>
                      ) : null}
                    </label>
                  ) : (
                    <div
                      className={styles["manual-order-modal__customer-grid-address-spacer"]}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </section>

              <div className={styles["manual-order-modal__workstation"]}>
                <section className={styles["manual-order-modal__products-panel"]}>
                  <div className={styles["manual-order-modal__panel-header"]}>
                    <h3 className={styles["manual-order-modal__section-title"]}>Productos</h3>
                    <p className={styles["manual-order-modal__panel-hint"]}>
                      Seleccioná productos para armar el pedido.
                    </p>
                  </div>

                  <label className="admin-field">
                    <span className="sr-only">Buscar producto</span>
                    <input
                      type="search"
                      className={styles["manual-order-modal__search"]}
                      placeholder="Buscar producto..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      disabled={isSubmitting || isProductsLoading || products.length === 0}
                    />
                  </label>

                  <div className={styles["manual-order-modal__products-scroll"]}>
                    {products.length === 0 ? (
                      <div className={styles["manual-order-modal__empty-products-block"]}>
                        <p className={styles["manual-order-modal__empty-products"]}>
                          No hay productos disponibles para cargar pedidos.
                        </p>
                        {onRefreshProducts ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={onRefreshProducts}
                            disabled={isSubmitting || isProductsLoading}
                          >
                            {isProductsLoading ? "Actualizando..." : "Reintentar"}
                          </Button>
                        ) : null}
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <p className={styles["manual-order-modal__empty-products"]}>
                        No encontramos productos para esa búsqueda.
                      </p>
                    ) : (
                      <div className={styles["manual-order-modal__product-list"]}>
                        {filteredProducts.map((product) => {
                          const isInOrder = selectedProductIds.has(product.id);
                          const needsConfiguration = !product.isManualOrderAvailable;
                          const unavailableReason =
                            product.manualOrderUnavailableReason ?? "Requiere personalización";
                          const canConfigure =
                            needsConfiguration && Boolean(product.customizationConfig);

                          return (
                            <div
                              key={product.id}
                              className={[
                                styles["manual-order-modal__product-row"],
                                isInOrder
                                  ? styles["manual-order-modal__product-row--selected"]
                                  : null,
                                needsConfiguration
                                  ? styles["manual-order-modal__product-row--blocked"]
                                  : null,
                                canConfigure
                                  ? styles["manual-order-modal__product-row--configurable"]
                                  : null
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <div className={styles["manual-order-modal__product-copy"]}>
                                <div className={styles["manual-order-modal__product-title-row"]}>
                                  <p className={styles["manual-order-modal__product-name"]}>
                                    {product.name}
                                  </p>
                                  {isInOrder ? (
                                    <span
                                      className={styles["manual-order-modal__product-selected-badge"]}
                                    >
                                      En pedido
                                    </span>
                                  ) : null}
                                  {needsConfiguration ? (
                                    <span
                                      className={styles["manual-order-modal__product-blocked-badge"]}
                                    >
                                      {unavailableReason}
                                    </span>
                                  ) : null}
                                </div>
                                {product.categoryName ? (
                                  <p className={styles["manual-order-modal__product-category"]}>
                                    {product.categoryName}
                                  </p>
                                ) : null}
                                {needsConfiguration ? (
                                  <p className={styles["manual-order-modal__product-blocked-hint"]}>
                                    {canConfigure
                                      ? "Tocá + para configurar opciones antes de agregar."
                                      : "Usá el catálogo hasta habilitar el selector manual."}
                                  </p>
                                ) : null}
                              </div>
                              <p className={styles["manual-order-modal__product-price"]}>
                                {formatCurrency(product.price)}
                              </p>
                              <button
                                type="button"
                                className={styles["manual-order-modal__add-button"]}
                                aria-label={
                                  needsConfiguration
                                    ? canConfigure
                                      ? `Configurar ${product.name}`
                                      : `${product.name}: ${unavailableReason}. No disponible en pedido manual.`
                                    : `Agregar ${product.name}`
                                }
                                onClick={() => addProduct(product.id)}
                                disabled={
                                  isSubmitting ||
                                  !canCreateOrder ||
                                  (needsConfiguration && !canConfigure)
                                }
                              >
                                +
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                <section className={styles["manual-order-modal__summary-panel"]}>
                  <div className={styles["manual-order-modal__ticket-header"]}>
                    <h3 className={styles["manual-order-modal__section-title"]}>Pedido</h3>
                    <p className={styles["manual-order-modal__ticket-subtitle"]}>
                      Ticket en construcción
                    </p>
                  </div>

                  <div className={styles["manual-order-modal__summary-scroll"]}>
                    {!hasSelectedItems ? (
                      <div className={styles["manual-order-modal__ticket-empty"]}>
                        <p className={styles["manual-order-modal__ticket-empty-title"]}>
                          Pedido vacío
                        </p>
                        <p className={styles["manual-order-modal__ticket-empty-copy"]}>
                          Agregá productos desde el catálogo para armar el pedido.
                        </p>
                      </div>
                    ) : (
                      <div className={styles["manual-order-modal__summary-list"]}>
                        {rootTicketLines.map((line) => {
                          const children = ticketLines.filter(
                            (child) =>
                              child.kind === "upsell" &&
                              child.parentClientLineId === line.clientLineId
                          );

                          return (
                            <div
                              key={line.clientLineId}
                              className={styles["manual-order-modal__summary-row"]}
                            >
                              <div className={styles["manual-order-modal__summary-row-head"]}>
                                <p className={styles["manual-order-modal__summary-line"]}>
                                  {line.quantity} × {line.productName}
                                </p>
                                <p className={styles["manual-order-modal__summary-subtotal"]}>
                                  {formatCurrency(line.lineTotal)}
                                </p>
                              </div>
                              {line.displaySummary.length > 0 ? (
                                <ul className={styles["manual-order-modal__summary-chips"]}>
                                  {line.displaySummary.map((entry) => (
                                    <li key={entry}>{entry}</li>
                                  ))}
                                </ul>
                              ) : null}
                              {children.map((child) => (
                                <div
                                  key={child.clientLineId}
                                  className={styles["manual-order-modal__summary-child"]}
                                >
                                  <p className={styles["manual-order-modal__summary-child-line"]}>
                                    {UPSELL_ASSOCIATED_LABEL}: {child.productName} ×{child.quantity}
                                  </p>
                                  <p className={styles["manual-order-modal__summary-child-total"]}>
                                    {formatCurrency(child.lineTotal)}
                                  </p>
                                </div>
                              ))}
                              <div className={styles["manual-order-modal__quantity-controls"]}>
                                <button
                                  type="button"
                                  className={styles["manual-order-modal__quantity-button"]}
                                  aria-label={`Quitar uno de ${line.productName}`}
                                  onClick={() =>
                                    updateLineQuantity(line.clientLineId, line.quantity - 1)
                                  }
                                  disabled={isSubmitting}
                                >
                                  -
                                </button>
                                <span className={styles["manual-order-modal__quantity-value"]}>
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  className={styles["manual-order-modal__quantity-button"]}
                                  aria-label={`Agregar uno de ${line.productName}`}
                                  onClick={() =>
                                    updateLineQuantity(line.clientLineId, line.quantity + 1)
                                  }
                                  disabled={isSubmitting}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  className={styles["manual-order-modal__remove-button"]}
                                  aria-label={`Quitar ${line.productName} del pedido`}
                                  onClick={() => removeLine(line.clientLineId)}
                                  disabled={isSubmitting}
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {fieldErrors.items ? (
                      <p className={styles["manual-order-modal__field-error"]}>
                        {fieldErrors.items}
                      </p>
                    ) : null}
                  </div>

                  <label className={`admin-field ${styles["manual-order-modal__notes-field"]}`}>
                    <span>Notas del pedido</span>
                    <textarea
                      name="notes"
                      rows={2}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={isSubmitting}
                      placeholder="Opcional"
                    />
                  </label>

                  <div
                    className={[
                      styles["manual-order-modal__total-block"],
                      hasSelectedItems
                        ? styles["manual-order-modal__total-block--active"]
                        : styles["manual-order-modal__total-block--idle"]
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className={styles["manual-order-modal__total-row"]}>
                      <p className={styles["manual-order-modal__total-label"]}>Total estimado</p>
                      <p className={styles["manual-order-modal__total-value"]}>
                        {formatCurrency(previewTotal)}
                      </p>
                    </div>
                    <p className={styles["manual-order-modal__total-note"]}>
                      El total final se valida al crear el pedido.
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

        <div className={styles["manual-order-modal__footer"]}>
          {view.type === "configure" ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={cancelConfigure}
                disabled={isSubmitting}
              >
                Volver
              </Button>
              <Button
                type="button"
                variant="primary"
                className={styles["manual-order-modal__submit-button"]}
                onClick={confirmConfigure}
                disabled={isSubmitting || !configureDraftValid}
              >
                Agregar · {formatCurrency(configurePreviewTotal)}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className={styles["manual-order-modal__submit-button"]}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  "Creando pedido..."
                ) : hasSelectedItems ? (
                  <>
                    <span className={styles["manual-order-modal__submit-label-desktop"]}>
                      Crear pedido · {formatCurrency(previewTotal)}
                    </span>
                    <span className={styles["manual-order-modal__submit-label-mobile"]}>
                      Crear pedido
                    </span>
                  </>
                ) : (
                  "Crear pedido"
                )}
              </Button>
            </>
          )}
        </div>
      </form>
    </AdminOrderModalShell>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
