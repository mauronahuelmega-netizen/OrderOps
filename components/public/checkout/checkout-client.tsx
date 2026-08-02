"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, Store } from "lucide-react";
import Input from "@/components/ui/Input";
import type { PublicBusiness } from "@/lib/business/public";
import {
  computeMaxDeliveryDate,
  computeMinDeliveryDate,
  getScheduledDeliveryDateError,
  normalizeScheduledDeliveryRules
} from "@/lib/business/scheduled-delivery-rules";
import {
  buildCheckoutCartPayload,
  buildHierarchicalCartRows,
  getCartItemCount,
  getCartItemsTotal,
  getCartStorageKeys,
  isLocalCartItemV2,
  loadUnifiedCartItems,
  type CartStorageScope,
  type HierarchicalCartRow,
  type LocalCartItem
} from "@/lib/cart/local";
import { formatPublicCatalogCurrency } from "@/lib/product-customization/public-shared";
import { UPSELL_ASSOCIATED_LABEL } from "@/lib/product-customization/upsell-copy";
import {
  CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE,
  buildCatalogPreviewPath
} from "@/lib/admin/catalog-preview-shared";
import { createPublicCheckoutOrderAction } from "@/app/b/[slug]/checkout/actions";
import { parseArgentineMobilePhone } from "@/lib/checkout/argentine-phone";
import AddressAutocomplete from "./address-autocomplete";
import styles from "./checkout-client.module.css";

type CheckoutClientProps = {
  business: PublicBusiness;
  slug: string;
  isCatalogPreview?: boolean;
};

type CheckoutFormState = {
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  notes: string;
};

const initialFormState: CheckoutFormState = {
  customerName: "",
  phone: "",
  deliveryDate: "",
  deliveryMethod: "delivery",
  address: "",
  notes: ""
};

function OrderSummary({
  cartRows,
  cartCount,
  cartTotal,
  catalogHref,
  showEditLink,
  titleId
}: {
  cartRows: HierarchicalCartRow[];
  cartCount: number;
  cartTotal: number;
  catalogHref: string;
  showEditLink: boolean;
  titleId: string;
}) {
  return (
    <section className={styles.summaryPanel} aria-labelledby={titleId}>
      <div className={styles.summaryHeader}>
        <div>
          <h2 id={titleId}>Resumen del pedido</h2>
          <p className={styles.summaryMeta}>
            {cartCount} {cartCount === 1 ? "producto" : "productos"}
          </p>
        </div>
        {showEditLink ? (
          <Link className={styles.editLink} href={catalogHref}>
            Editar pedido
          </Link>
        ) : null}
      </div>

      <div className={styles.summaryList}>
        {cartRows.map((row) => {
          if (row.kind === "legacy") {
            const item = row.item;
            const legacyLineTotal = item.price * item.quantity;
            return (
              <article key={`legacy-${item.productId}`} className={styles.summaryItem}>
                <div className={styles.summaryItemCopy}>
                  <h3>{item.name}</h3>
                  {item.quantity > 1 ? (
                    <p className={styles.summaryQty}>
                      {item.quantity} × {formatPublicCatalogCurrency(item.price)}
                    </p>
                  ) : null}
                </div>
                <strong className={styles.summaryItemTotal}>
                  {formatPublicCatalogCurrency(legacyLineTotal)}
                </strong>
              </article>
            );
          }

          const { parent, children } = row;

          return (
            <article key={parent.cartLineId} className={styles.summaryItem}>
              <div className={styles.summaryItemCopy}>
                <div className={styles.summaryParentRow}>
                  <div className={styles.summaryParentCopy}>
                    <h3>{parent.productName}</h3>
                    {parent.quantity > 1 ? (
                      <p className={styles.summaryQty}>
                        {parent.quantity} ×{" "}
                        {formatPublicCatalogCurrency(parent.finalUnitPrice)}
                      </p>
                    ) : null}
                  </div>
                  <strong className={styles.summaryItemTotal}>
                    {formatPublicCatalogCurrency(parent.lineTotal)}
                  </strong>
                </div>
                {parent.displaySummary.length > 0 ? (
                  <ul className={styles.summaryLines}>
                    {parent.displaySummary.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                {children.length > 0 ? (
                  <div className={styles.upsellBlock}>
                    <p className={styles.upsellLabel}>{UPSELL_ASSOCIATED_LABEL}</p>
                    {children.map((child) => (
                      <div key={child.cartLineId} className={styles.upsellLine}>
                        <span className={styles.upsellName}>{child.productName}</span>
                        <strong className={styles.upsellPrice}>
                          {formatPublicCatalogCurrency(child.lineTotal)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}

        <div className={styles.summaryTotalRow}>
          <span>Total</span>
          <strong>{formatPublicCatalogCurrency(cartTotal)}</strong>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutClient({
  business,
  slug,
  isCatalogPreview = false
}: CheckoutClientProps) {
  const router = useRouter();
  const cartScope: CartStorageScope = isCatalogPreview ? "preview" : "public";
  const [unifiedCartItems, setUnifiedCartItems] = useState<LocalCartItem[]>([]);
  const [formState, setFormState] = useState<CheckoutFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storageKeys = getCartStorageKeys(business.id, cartScope);
  const catalogHref = isCatalogPreview
    ? buildCatalogPreviewPath(slug, "catalogo")
    : `/b/${slug}/catalogo`;

  const businessStyles = {
    "--business-primary": business.primary_color ?? "var(--color-primary)",
    "--business-primary-foreground": "#ffffff"
  } as CSSProperties;

  useEffect(() => {
    setUnifiedCartItems(loadUnifiedCartItems(business.id, cartScope));
  }, [business.id, cartScope, storageKeys.legacy, storageKeys.v2]);

  const cartRows = useMemo(
    () => buildHierarchicalCartRows(unifiedCartItems),
    [unifiedCartItems]
  );
  const cartCount = useMemo(() => getCartItemCount(unifiedCartItems), [unifiedCartItems]);
  const cartTotal = useMemo(() => getCartItemsTotal(unifiedCartItems), [unifiedCartItems]);
  const hasCustomizedItems = useMemo(
    () => unifiedCartItems.some(isLocalCartItemV2),
    [unifiedCartItems]
  );
  const formattedTotal = formatPublicCatalogCurrency(cartTotal);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const onDemandModeActive = business.on_demand_mode_active;
  const scheduledModeActive = business.scheduled_mode_active;
  const scheduledRules = useMemo(
    () =>
      normalizeScheduledDeliveryRules({
        scheduled_min_lead_time_hours: business.scheduled_min_lead_time_hours,
        scheduled_max_days_in_advance: business.scheduled_max_days_in_advance,
        scheduled_cutoff_time: business.scheduled_cutoff_time,
        inactive_working_days: business.inactive_working_days
      }),
    [
      business.inactive_working_days,
      business.scheduled_cutoff_time,
      business.scheduled_max_days_in_advance,
      business.scheduled_min_lead_time_hours
    ]
  );
  const minSelectableDeliveryDate = useMemo(
    () => (scheduledModeActive ? computeMinDeliveryDate(scheduledRules) : today),
    [scheduledModeActive, scheduledRules, today]
  );
  const maxSelectableDeliveryDate = useMemo(
    () => (scheduledModeActive ? computeMaxDeliveryDate(scheduledRules) : today),
    [scheduledModeActive, scheduledRules, today]
  );
  const ordersClosedMessage = "El negocio no está aceptando pedidos en este momento.";

  useEffect(() => {
    if (!scheduledModeActive) {
      return;
    }

    setFormState((current) => {
      if (
        current.deliveryDate &&
        !getScheduledDeliveryDateError(current.deliveryDate, scheduledRules)
      ) {
        return current;
      }

      return {
        ...current,
        deliveryDate: minSelectableDeliveryDate
      };
    });
  }, [minSelectableDeliveryDate, scheduledModeActive, scheduledRules]);

  function handleFieldChange(
    field: keyof CheckoutFormState,
    value: string | CheckoutFormState["deliveryMethod"]
  ) {
    if (field === "phone") setPhoneError(null);
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (isCatalogPreview) {
      setErrorMessage(CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!onDemandModeActive) {
        setErrorMessage(ordersClosedMessage);
        return;
      }

      const latestUnified = loadUnifiedCartItems(business.id, cartScope);
      if (latestUnified.length === 0) {
        setErrorMessage("Tu carrito está vacío.");
        return;
      }

      if (!formState.customerName.trim()) {
        setErrorMessage("Ingresá tu nombre.");
        return;
      }

      const parsedPhone = parseArgentineMobilePhone(formState.phone);
      if (!parsedPhone.ok) {
        setPhoneError(
          parsedPhone.reason === "empty"
            ? "Ingresá tu teléfono."
            : "Ingresá un número de celular argentino válido."
        );
        document.getElementById("phone")?.focus();
        return;
      }

      if (scheduledModeActive && !formState.deliveryDate) {
        setErrorMessage("Seleccioná una fecha de entrega.");
        return;
      }

      const deliveryDate = scheduledModeActive ? formState.deliveryDate : today;

      if (scheduledModeActive) {
        const deliveryDateError = getScheduledDeliveryDateError(deliveryDate, scheduledRules);

        if (deliveryDateError) {
          setErrorMessage(deliveryDateError);
          return;
        }
      }

      if (!["delivery", "pickup"].includes(formState.deliveryMethod)) {
        setErrorMessage("Seleccioná un método de entrega válido.");
        return;
      }

      if (formState.deliveryMethod === "delivery" && !formState.address.trim()) {
        setErrorMessage("Ingresá la dirección de entrega.");
        return;
      }

      const cart = buildCheckoutCartPayload(latestUnified);

      const result = await createPublicCheckoutOrderAction(slug, {
        customerName: formState.customerName.trim(),
        phone: parsedPhone.e164,
        deliveryDate,
        deliveryMethod: formState.deliveryMethod,
        address:
          formState.deliveryMethod === "delivery" ? formState.address.trim() : null,
        notes: formState.notes.trim() ? formState.notes.trim() : null,
        cart,
        isPreview: false
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      const orderId = result.orderId;

      void fetch(`/api/internal/orders/${encodeURIComponent(orderId)}/push`, {
        method: "POST",
        credentials: "same-origin",
        keepalive: true
      }).catch(() => {
        // Push delivery is best-effort. Never block checkout success on this call.
      });

      window.localStorage.removeItem(storageKeys.legacy);
      window.localStorage.removeItem(storageKeys.v2);
      router.push(`/b/${slug}/success?order_id=${encodeURIComponent(orderId)}`);
    } catch {
      setErrorMessage("No pudimos crear el pedido. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel = isCatalogPreview
    ? "Confirmación deshabilitada"
    : isSubmitting
      ? "Enviando…"
      : `Enviar pedido · ${formattedTotal}`;

  if (unifiedCartItems.length === 0) {
    return (
      <main className={styles.page} style={businessStyles}>
        <header className={styles.header}>
          <Link
            className={styles.backButton}
            href={catalogHref}
            aria-label="Volver al catálogo"
          >
            <ArrowLeft className={styles.icon} aria-hidden="true" strokeWidth={2.25} />
          </Link>
          <div className={styles.headerCopy}>
            <h1>Finalizá tu pedido</h1>
            <p>Completá tus datos para enviarlo al negocio.</p>
          </div>
        </header>

        <section className={styles.emptyState}>
          <div className={styles.emptyCard}>
            <h2>Tu pedido está vacío</h2>
            <p>Agregá productos antes de continuar.</p>
            <Link className={styles.emptyButton} href={catalogHref}>
              Volver al catálogo
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page} style={businessStyles}>
      <header className={styles.header}>
        <Link
          className={styles.backButton}
          href={catalogHref}
          aria-label="Volver al catálogo"
        >
          <ArrowLeft className={styles.icon} aria-hidden="true" strokeWidth={2.25} />
        </Link>
        <div className={styles.headerCopy}>
          <h1>Finalizá tu pedido</h1>
          <p>Completá tus datos para enviarlo al negocio.</p>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <form id="checkout-form" className={styles.form} onSubmit={handleSubmit} noValidate>
            {isCatalogPreview ? (
              <p className={`${styles.message} ${styles.messageError}`} role="status">
                {CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE}
              </p>
            ) : null}

            {!onDemandModeActive && !isCatalogPreview ? (
              <p className={`${styles.message} ${styles.messageError}`} role="status">
                {ordersClosedMessage}
              </p>
            ) : null}

            {hasCustomizedItems ? (
              <p className={styles.message} role="status">
                Tu pedido incluye productos personalizados. Los precios se confirman al
                enviar.
              </p>
            ) : null}

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Cómo recibís el pedido</h2>
                <p>
                  {scheduledModeActive
                    ? "Elegí modalidad y cuándo lo necesitás."
                    : "Elegí si lo retirás o te lo enviamos."}
                </p>
              </div>

              <fieldset className={styles.segmented}>
                <legend className={styles.segmentedLegend}>Método de entrega</legend>
                <label
                  className={[
                    styles.segmentOption,
                    formState.deliveryMethod === "delivery"
                      ? styles.segmentOptionSelected
                      : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name="delivery_method"
                    value="delivery"
                    checked={formState.deliveryMethod === "delivery"}
                    onChange={() => handleFieldChange("deliveryMethod", "delivery")}
                  />
                  <Bike className={styles.segmentIcon} aria-hidden="true" strokeWidth={2.1} />
                  <span>Envío</span>
                </label>
                <label
                  className={[
                    styles.segmentOption,
                    formState.deliveryMethod === "pickup"
                      ? styles.segmentOptionSelected
                      : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name="delivery_method"
                    value="pickup"
                    checked={formState.deliveryMethod === "pickup"}
                    onChange={() => handleFieldChange("deliveryMethod", "pickup")}
                  />
                  <Store className={styles.segmentIcon} aria-hidden="true" strokeWidth={2.1} />
                  <span>Retiro</span>
                </label>
              </fieldset>

              {scheduledModeActive ? (
                <div className={styles.fieldGrid}>
                  <Input
                    label="Fecha de entrega"
                    name="delivery_date"
                    type="date"
                    min={minSelectableDeliveryDate}
                    max={maxSelectableDeliveryDate}
                    value={formState.deliveryDate}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      const dateError = getScheduledDeliveryDateError(
                        nextDate,
                        scheduledRules
                      );

                      if (dateError) {
                        setErrorMessage(dateError);
                        return;
                      }

                      setErrorMessage(null);
                      handleFieldChange("deliveryDate", nextDate);
                    }}
                    helperText={`Disponible entre ${minSelectableDeliveryDate} y ${maxSelectableDeliveryDate}.`}
                    required
                  />
                </div>
              ) : null}

              {formState.deliveryMethod === "delivery" ? (
                <div className={styles.fieldGrid}>
                  <div className={styles.sectionHeader}>
                    <h2>¿Dónde lo entregamos?</h2>
                    <p>Usá una dirección donde puedan recibirte.</p>
                  </div>
                  <AddressAutocomplete
                    value={formState.address}
                    onChange={(value) => handleFieldChange("address", value)}
                  />
                </div>
              ) : (
                <p className={styles.pickupInfo}>
                  Retiro en {business.name}. Te confirmamos los detalles por WhatsApp.
                </p>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Tus datos</h2>
                <p>Así sabemos a nombre de quién preparar el pedido.</p>
              </div>
              <div className={styles.fieldGrid}>
                <Input
                  label="Nombre"
                  name="customer_name"
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  value={formState.customerName}
                  onChange={(event) => handleFieldChange("customerName", event.target.value)}
                  required
                />
                <Input
                  label="Teléfono"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formState.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  onBlur={() => {
                    if (formState.phone.trim() && !parseArgentineMobilePhone(formState.phone).ok) {
                      setPhoneError("Ingresá un número de celular argentino válido.");
                    }
                  }}
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? "checkout-phone-error" : "checkout-phone-helper"}
                  required
                />
                {phoneError ? (
                  <p id="checkout-phone-error" className="ui-error">
                    {phoneError}
                  </p>
                ) : (
                  <p id="checkout-phone-helper" className="ui-helper">
                    Ejemplo: 11 1234-5678
                  </p>
                )}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Notas para el pedido</h2>
                <p>Aclaraciones que el negocio deba tener en cuenta.</p>
              </div>
              <label className={styles.textareaField} htmlFor="notes">
                <span className={styles.textareaLabel}>Notas</span>
                <textarea
                  id="notes"
                  className={styles.textarea}
                  name="notes"
                  rows={4}
                  value={formState.notes}
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                />
              </label>
            </section>

            {errorMessage ? (
              <p className={`${styles.message} ${styles.messageError}`} role="alert">
                {errorMessage}
              </p>
            ) : null}
            {statusMessage ? (
              <p className={`${styles.message} ${styles.messageSuccess}`} role="status">
                {statusMessage}
              </p>
            ) : null}

            <div className={styles.mobileSummary}>
              <OrderSummary
                cartRows={cartRows}
                cartCount={cartCount}
                cartTotal={cartTotal}
                catalogHref={catalogHref}
                showEditLink
                titleId="checkout-summary-title-mobile"
              />
            </div>

            <div className={styles.stickyFooter}>
              <div className={styles.stickyInner}>
                <div className={styles.stickyTotal}>
                  <span>Total</span>
                  <strong>{formattedTotal}</strong>
                </div>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !onDemandModeActive || isCatalogPreview}
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className={styles.desktopSummary}>
          <OrderSummary
            cartRows={cartRows}
            cartCount={cartCount}
            cartTotal={cartTotal}
            catalogHref={catalogHref}
            showEditLink
            titleId="checkout-summary-title-desktop"
          />
        </aside>
      </div>
    </main>
  );
}
