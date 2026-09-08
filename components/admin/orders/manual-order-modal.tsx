"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { createManualOrderAction } from "@/app/admin/(protected)/orders/actions";
import AdminOrderModalShell from "@/components/admin/orders/admin-order-modal-shell";
import ManualOrderCustomizationPanel, {
  createEmptyManualOrderCustomizationDraft,
  getManualOrderCustomizationDraftBlockingReason,
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

// Stable, local id: the CTA only references it while the note is rendered.
const CONFIGURE_BLOCKING_NOTE_ID = "manual-order-configure-blocking-note";

// The opener has to be read before the shell moves focus to its close button.
// The shell does that in a passive effect, and passive effects run child-first,
// so only a layout effect in this parent still sees the dashboard trigger.
const useOpenerCaptureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

/**
 * Focusables inside the modal dialog only. Nothing outside `container` is ever
 * queried or mutated, so the dashboard behind the modal keeps its own tab order
 * and no background node gets a temporary tabindex.
 */
function getManualOrderFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.tabIndex !== -1 &&
      // Drops unmounted/`display: none` nodes while keeping the visually hidden
      // delivery radios, which are still real keyboard stops.
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== "hidden"
  );
}

type ManualOrderFieldErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
  items?: string;
};

type ManualTicketSummaryGroup = {
  groupId: string;
  groupName: string;
  options: Array<{
    optionId: string;
    optionName: string;
    quantity: number;
    totalPriceDelta: number;
  }>;
};

/*
 * Presentation projection of the snapshot the domain already built for the line.
 * Every value is read as-is from CustomizationSnapshotV2 — group_name,
 * option_name, option quantity and the option's own total_price_delta (already
 * priceDelta × qty, computed upstream). No display string is parsed and no
 * price is recomputed here: this only decides grouping and order for render.
 */
function getManualTicketSummaryGroups(
  line: ManualOrderTicketLine
): ManualTicketSummaryGroup[] {
  const snapshot = line.customizationSnapshot;
  if (!snapshot) {
    return [];
  }

  return [...snapshot.groups]
    .filter((group) => group.selected_options.length > 0)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((group) => ({
      groupId: group.group_id,
      groupName: group.group_name,
      options: [...group.selected_options]
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((option) => ({
          optionId: option.option_id,
          optionName: option.option_name,
          quantity: option.quantity,
          totalPriceDelta: option.total_price_delta
        }))
    }));
}

/*
 * The required customer/delivery rules, exactly as validateForm has always
 * defined them: name and phone non-empty, address non-empty only for delivery.
 * Extracted so CTA readiness and submit-time errors read the SAME function and
 * cannot drift. No rule is added, removed, reordered or hardened here.
 */
function getManualOrderRequiredFieldErrors(input: {
  customerName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  address: string;
}): ManualOrderFieldErrors {
  const requiredErrors: ManualOrderFieldErrors = {};

  if (!input.customerName.trim()) {
    requiredErrors.customerName = "El nombre del cliente es obligatorio.";
  }

  if (!input.phone.trim()) {
    requiredErrors.phone = "El teléfono es obligatorio.";
  }

  if (input.deliveryMethod === "delivery" && !input.address.trim()) {
    requiredErrors.address = "La dirección es obligatoria para delivery.";
  }

  return requiredErrors;
}

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
  /*
   * Presentation-only: gates when the configurator blocking reason escalates from
   * quiet context to an error tone, and when a still-missing group gets marked.
   * It never feeds configureDraftValid, the disabled state, selection, pricing or
   * the ticket payload.
   */
  const [hasConfigureInteraction, setHasConfigureInteraction] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const submitLockRef = useRef(false);
  // The modal body is the single scroll owner (≤899) and stays the only element
  // this component scrolls: subview switches must never inherit compose offset.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const composeScrollTopRef = useRef(0);
  // The real dialog node, handed over by the shell: focus containment is scoped
  // to it so nothing outside the modal is ever queried.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

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
  /*
   * Readiness of the fields validateForm already requires, evaluated live so the
   * CTA stops claiming the order is ready while required data is missing (P1-2).
   * Same rules, same source: it derives from getManualOrderRequiredFieldErrors.
   */
  const requiredFormReady = useMemo(
    () =>
      Object.keys(
        getManualOrderRequiredFieldErrors({
          customerName,
          phone,
          deliveryMethod,
          address
        })
      ).length === 0,
    [address, customerName, deliveryMethod, phone]
  );
  const canSubmit =
    canCreateOrder &&
    !isSubmitting &&
    products.length > 0 &&
    hasSelectedItems &&
    ticketSubmitReady &&
    requiredFormReady;

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

  const configureBlockingReason =
    configureConfig && customizationDraft
      ? getManualOrderCustomizationDraftBlockingReason(configureConfig, customizationDraft)
      : null;

  // Identity of the current subview. Changing product re-enters the configurator,
  // so the product id participates: reopening must also start at the top.
  const viewKey =
    view.type === "configure" ? `configure:${view.productId}` : "compose";

  const shellTitle = configureProduct
    ? `Configurar ${configureProduct.name}`
    : "Nuevo pedido";
  const shellSubtitle = configureProduct
    ? "Elegí las opciones para este producto."
    : "Cargá un pedido tomado manualmente.";

  // Subview scroll entry. Only `manual-order-modal__body` is ever scrolled here:
  // no window/document scrolling, no scrollIntoView, no second scroll owner.
  // Entering the configurator always lands on its own top (product identity,
  // base price, quantity and first required group); returning to compose restores
  // the offset captured when the configurator was opened.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    body.scrollTop = viewKey === "compose" ? composeScrollTopRef.current : 0;
  }, [viewKey]);

  // Remember whatever opened the modal so closing can hand focus straight back.
  useOpenerCaptureEffect(() => {
    if (!isOpen) {
      return;
    }

    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
  }, [isOpen]);

  // Return focus on close. The shell owns Escape and the initial focus; it does
  // not own return focus, so there is no second focus jump to compete with.
  useEffect(() => {
    if (isOpen) {
      return;
    }

    const opener = openerRef.current;
    openerRef.current = null;

    if (opener?.isConnected) {
      opener.focus();
    }
  }, [isOpen]);

  /*
   * Keyboard containment. The listener lives on the dialog node itself, so it
   * only ever sees keystrokes that already happened inside the modal: no window
   * or document listener, no background node is inspected or mutated, and the
   * live focusable list is recomputed per keystroke so disabled CTAs and the
   * unmounted compose/configure subview drop out on their own.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const focusables = getManualOrderFocusableElements(dialog);
      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const activeIsInside = active instanceof HTMLElement && dialog.contains(active);

      if (event.shiftKey) {
        if (!activeIsInside || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeIsInside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, view.type]);

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
    setHasConfigureInteraction(false);
    setErrorMessage(null);
    setFieldErrors({});
    composeScrollTopRef.current = 0;
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

    // Captured before the subview swaps so `Volver` can come back to the product
    // the operator was looking at, and reset in the same event so the browser
    // never paints the configurator at the inherited compose offset.
    composeScrollTopRef.current = bodyRef.current?.scrollTop ?? 0;
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    setErrorMessage(null);
    setHasConfigureInteraction(false);
    setCustomizationDraft(createEmptyManualOrderCustomizationDraft(productId));
    setView({ type: "configure", productId });
  };

  const handleConfigureDraftChange = (nextDraft: ManualOrderCustomizationDraft) => {
    setHasConfigureInteraction(true);
    setCustomizationDraft(nextDraft);
  };

  const cancelConfigure = () => {
    setHasConfigureInteraction(false);
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
    setHasConfigureInteraction(false);
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
    // Same required-field rules as before, now read from the shared helper.
    const nextFieldErrors: ManualOrderFieldErrors = getManualOrderRequiredFieldErrors({
      customerName,
      phone,
      deliveryMethod,
      address
    });

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
            "Hay un adicional sin producto principal. Revisá el pedido.";
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
      title={shellTitle}
      variant="workstation"
      dialogRef={dialogRef}
      closeLabel={
        configureProduct
          ? `Cerrar configuración de ${configureProduct.name}`
          : "Cerrar nuevo pedido manual"
      }
      overlayLabel="Salir del pedido manual"
      closeClassName={styles["manual-order-modal__shell-close"]}
      headerLeading={
        <div className={styles["manual-order-modal__header-copy"]}>
          <h2>{shellTitle}</h2>
          <p className={styles["manual-order-modal__subtitle"]}>{shellSubtitle}</p>
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
        <div className={styles["manual-order-modal__body"]} ref={bodyRef}>
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
              key={configureProduct.id}
              productName={configureProduct.name}
              config={configureConfig}
              draft={customizationDraft}
              onDraftChange={handleConfigureDraftChange}
              hasInteracted={hasConfigureInteraction}
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
                                      ? "Configurá las opciones antes de agregarlo."
                                      : "Todavía no se puede agregar a un pedido manual."}
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
                      Resumen del pedido
                    </p>
                  </div>

                  <div className={styles["manual-order-modal__summary-scroll"]}>
                    {!hasSelectedItems ? (
                      <div className={styles["manual-order-modal__ticket-empty"]}>
                        <p className={styles["manual-order-modal__ticket-empty-title"]}>
                          Todavía no agregaste productos
                        </p>
                        <p className={styles["manual-order-modal__ticket-empty-copy"]}>
                          Agregá productos para armar el pedido.
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

                          const summaryGroups = getManualTicketSummaryGroups(line);

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
                              {summaryGroups.length > 0 ? (
                                <ul className={styles["manual-order-modal__summary-groups"]}>
                                  {summaryGroups.map((group) => (
                                    <li
                                      key={group.groupId}
                                      className={styles["manual-order-modal__summary-group"]}
                                    >
                                      <p
                                        className={
                                          styles["manual-order-modal__summary-group-label"]
                                        }
                                      >
                                        {group.groupName}
                                      </p>
                                      <ul
                                        className={styles["manual-order-modal__summary-options"]}
                                      >
                                        {group.options.map((option) => (
                                          <li
                                            key={option.optionId}
                                            className={
                                              styles["manual-order-modal__summary-option"]
                                            }
                                          >
                                            <span
                                              className={
                                                styles["manual-order-modal__summary-option-name"]
                                              }
                                            >
                                              {option.optionName}
                                              {option.quantity > 1 ? (
                                                <span
                                                  className={
                                                    styles[
                                                      "manual-order-modal__summary-option-qty"
                                                    ]
                                                  }
                                                >
                                                  ×{option.quantity}
                                                </span>
                                              ) : null}
                                            </span>
                                            {option.totalPriceDelta > 0 ? (
                                              <span
                                                className={
                                                  styles[
                                                    "manual-order-modal__summary-option-delta"
                                                  ]
                                                }
                                              >
                                                +{formatCurrency(option.totalPriceDelta)}
                                              </span>
                                            ) : null}
                                          </li>
                                        ))}
                                      </ul>
                                    </li>
                                  ))}
                                </ul>
                              ) : line.displaySummary.length > 0 ? (
                                /* Legacy/degraded lines without a snapshot keep the
                                   previous rendering: the string is shown whole, never
                                   parsed to rebuild groups. */
                                <ul className={styles["manual-order-modal__summary-chips"]}>
                                  {line.displaySummary.map((entry) => (
                                    <li key={entry}>{entry}</li>
                                  ))}
                                </ul>
                              ) : null}
                              {children.length > 0 ? (
                                <div
                                  className={styles["manual-order-modal__summary-upsells"]}
                                  aria-label={UPSELL_ASSOCIATED_LABEL}
                                >
                                  <p
                                    className={
                                      styles["manual-order-modal__summary-group-label"]
                                    }
                                  >
                                    {UPSELL_ASSOCIATED_LABEL}
                                  </p>
                                  {children.map((child) => (
                                    <div
                                      key={child.clientLineId}
                                      className={styles["manual-order-modal__summary-child"]}
                                    >
                                      <span
                                        className={
                                          styles["manual-order-modal__summary-child-line"]
                                        }
                                      >
                                        {child.productName}
                                        <span
                                          className={
                                            styles["manual-order-modal__summary-option-qty"]
                                          }
                                        >
                                          ×{child.quantity}
                                        </span>
                                      </span>
                                      <span
                                        className={
                                          styles["manual-order-modal__summary-child-total"]
                                        }
                                      >
                                        {formatCurrency(child.lineTotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              <div className={styles["manual-order-modal__summary-actions"]}>
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
                                </div>
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
                aria-describedby={
                  configureBlockingReason ? CONFIGURE_BLOCKING_NOTE_ID : undefined
                }
              >
                {configureDraftValid ? (
                  <span className={styles["manual-order-modal__submit-label"]}>
                    Agregar · {formatCurrency(configurePreviewTotal)}
                  </span>
                ) : (
                  "Completá las opciones"
                )}
              </Button>
              {/*
                Canonical blocking-feedback surface. It lives in the sticky action
                area so the reason stays next to `Agregar` at any scroll position,
                and it is the only place this sentence is rendered. Last in DOM
                because the footer is column-reverse ≤899: that puts it directly
                above the CTA on mobile, while `order` pulls it left on the row
                layout.
              */}
              {configureBlockingReason ? (
                <p
                  id={CONFIGURE_BLOCKING_NOTE_ID}
                  className={styles["manual-order-modal__configure-note"]}
                  data-tone={hasConfigureInteraction ? "error" : "quiet"}
                  role="status"
                >
                  {configureBlockingReason}
                </p>
              ) : null}
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
                ) : !hasSelectedItems ? (
                  "Agregá productos"
                ) : !requiredFormReady ? (
                  "Completá los datos obligatorios"
                ) : (
                  <span className={styles["manual-order-modal__submit-label"]}>
                    Crear pedido · {formatCurrency(previewTotal)}
                  </span>
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
