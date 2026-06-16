"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  createManualOrderAction,
  type ManualOrderProductOption
} from "@/app/admin/(protected)/orders/actions";
import AdminOrderModalShell from "@/components/admin/orders/admin-order-modal-shell";
import Button from "@/components/ui/Button";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import styles from "./manual-order-modal.module.css";

export type { ManualOrderProductOption };

type DeliveryMethod = "delivery" | "pickup";

type SelectedManualOrderItem = {
  productId: string;
  quantity: number;
};

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
  searchQuery: "",
  selectedItems: [] as SelectedManualOrderItem[]
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
  const [selectedItems, setSelectedItems] = useState<SelectedManualOrderItem[]>(
    INITIAL_FORM_STATE.selectedItems
  );
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
    () =>
      selectedItems.reduce((total, item) => {
        const product = productById.get(item.productId);

        if (!product) {
          return total;
        }

        return total + product.price * item.quantity;
      }, 0),
    [productById, selectedItems]
  );

  const hasSelectedItems = selectedItems.length > 0;

  const selectedProductIds = useMemo(
    () => new Set(selectedItems.map((item) => item.productId)),
    [selectedItems]
  );

  const resetForm = useCallback(() => {
    setCustomerName(INITIAL_FORM_STATE.customerName);
    setPhone(INITIAL_FORM_STATE.phone);
    setDeliveryMethod(INITIAL_FORM_STATE.deliveryMethod);
    setAddress(INITIAL_FORM_STATE.address);
    setNotes(INITIAL_FORM_STATE.notes);
    setSearchQuery(INITIAL_FORM_STATE.searchQuery);
    setSelectedItems(INITIAL_FORM_STATE.selectedItems);
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

  const addProduct = (productId: string) => {
    setSelectedItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === productId);

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentItems, { productId, quantity: 1 }];
    });
    setFieldErrors((currentErrors) => ({ ...currentErrors, items: undefined }));
  };

  const updateItemQuantity = (productId: string, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      setSelectedItems((currentItems) =>
        currentItems.filter((item) => item.productId !== productId)
      );
      return;
    }

    setSelectedItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQuantity } : item
      )
    );
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

    if (selectedItems.length === 0) {
      nextFieldErrors.items = "Agregá al menos un producto.";
    }

    for (const item of selectedItems) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        nextFieldErrors.items = "La cantidad debe ser mayor a cero.";
        break;
      }
    }

    setFieldErrors(nextFieldErrors);

    return Object.keys(nextFieldErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateOrder || isSubmitting || submitLockRef.current) {
      return;
    }

    setErrorMessage(null);

    if (!validateForm()) {
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
          items: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          }))
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
                    setFieldErrors((currentErrors) => ({ ...currentErrors, phone: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  disabled={isSubmitting}
                />
                {fieldErrors.phone ? (
                  <p className={styles["manual-order-modal__field-error"]}>{fieldErrors.phone}</p>
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
                      setFieldErrors((currentErrors) => ({ ...currentErrors, address: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.address)}
                    disabled={isSubmitting}
                  />
                  {fieldErrors.address ? (
                    <p className={styles["manual-order-modal__field-error"]}>{fieldErrors.address}</p>
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

                      return (
                      <div
                        key={product.id}
                        className={[
                          styles["manual-order-modal__product-row"],
                          isInOrder ? styles["manual-order-modal__product-row--selected"] : null
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className={styles["manual-order-modal__product-copy"]}>
                          <div className={styles["manual-order-modal__product-title-row"]}>
                            <p className={styles["manual-order-modal__product-name"]}>{product.name}</p>
                            {isInOrder ? (
                              <span className={styles["manual-order-modal__product-selected-badge"]}>
                                En pedido
                              </span>
                            ) : null}
                          </div>
                          {product.categoryName ? (
                            <p className={styles["manual-order-modal__product-category"]}>
                              {product.categoryName}
                            </p>
                          ) : null}
                        </div>
                        <p className={styles["manual-order-modal__product-price"]}>
                          {formatCurrency(product.price)}
                        </p>
                        <button
                          type="button"
                          className={styles["manual-order-modal__add-button"]}
                          aria-label={`Agregar ${product.name}`}
                          onClick={() => addProduct(product.id)}
                          disabled={isSubmitting || !canCreateOrder}
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
                <p className={styles["manual-order-modal__ticket-subtitle"]}>Ticket en construcción</p>
              </div>

              <div className={styles["manual-order-modal__summary-scroll"]}>
                {!hasSelectedItems ? (
                  <div className={styles["manual-order-modal__ticket-empty"]}>
                    <p className={styles["manual-order-modal__ticket-empty-title"]}>Pedido vacío</p>
                    <p className={styles["manual-order-modal__ticket-empty-copy"]}>
                      Agregá productos desde el catálogo para armar el pedido.
                    </p>
                  </div>
                ) : (
                  <div className={styles["manual-order-modal__summary-list"]}>
                    {selectedItems.map((item) => {
                      const product = productById.get(item.productId);

                      if (!product) {
                        return null;
                      }

                      return (
                        <div key={item.productId} className={styles["manual-order-modal__summary-row"]}>
                          <div className={styles["manual-order-modal__summary-row-head"]}>
                            <p className={styles["manual-order-modal__summary-line"]}>
                              {item.quantity} × {product.name}
                            </p>
                            <p className={styles["manual-order-modal__summary-subtotal"]}>
                              {formatCurrency(product.price * item.quantity)}
                            </p>
                          </div>
                          <div className={styles["manual-order-modal__quantity-controls"]}>
                            <button
                              type="button"
                              className={styles["manual-order-modal__quantity-button"]}
                              aria-label={`Quitar uno de ${product.name}`}
                              onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              disabled={isSubmitting}
                            >
                              -
                            </button>
                            <span className={styles["manual-order-modal__quantity-value"]}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className={styles["manual-order-modal__quantity-button"]}
                              aria-label={`Agregar uno de ${product.name}`}
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                              disabled={isSubmitting}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {fieldErrors.items ? (
                  <p className={styles["manual-order-modal__field-error"]}>{fieldErrors.items}</p>
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
        </div>

        <div className={styles["manual-order-modal__footer"]}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={styles["manual-order-modal__submit-button"]}
            disabled={!canCreateOrder || isSubmitting || products.length === 0}
          >
            {isSubmitting ? (
              "Creando pedido..."
            ) : hasSelectedItems ? (
              <>
                <span className={styles["manual-order-modal__submit-label-desktop"]}>
                  Crear pedido · {formatCurrency(previewTotal)}
                </span>
                <span className={styles["manual-order-modal__submit-label-mobile"]}>Crear pedido</span>
              </>
            ) : (
              "Crear pedido"
            )}
          </Button>
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
