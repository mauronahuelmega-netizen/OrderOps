"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import type { PublicBusiness } from "@/lib/business/public";
import {
  getCartStorageKey,
  parseLocalCartItems,
  type LocalCartItem
} from "@/lib/cart/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CheckoutClientProps = {
  business: PublicBusiness;
  slug: string;
};

type CheckoutFormState = {
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  notes: string;
};

type CreateOrderPayload = {
  p_business_id: string;
  p_customer_name: string;
  p_phone: string;
  p_delivery_date: string;
  p_delivery_method: "delivery" | "pickup";
  p_address: string | null;
  p_notes: string | null;
  p_items: Array<{
    product_id: string;
    quantity: number;
  }>;
};

const initialFormState: CheckoutFormState = {
  customerName: "",
  phone: "",
  deliveryDate: "",
  deliveryMethod: "delivery",
  address: "",
  notes: ""
};

export default function CheckoutClient({ business, slug }: CheckoutClientProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [formState, setFormState] = useState<CheckoutFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storageKey = getCartStorageKey(business.id);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedItems = parseLocalCartItems(storedValue);
    setCartItems(parsedItems);
  }, [storageKey]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function handleFieldChange(
    field: keyof CheckoutFormState,
    value: string | CheckoutFormState["deliveryMethod"]
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      if (cartItems.length === 0) {
        setErrorMessage("Tu carrito está vacío.");
        return;
      }

      if (!formState.customerName.trim()) {
        setErrorMessage("Ingresá tu nombre.");
        return;
      }

      if (!formState.phone.trim()) {
        setErrorMessage("Ingresá tu teléfono.");
        return;
      }

      if (!formState.deliveryDate) {
        setErrorMessage("Seleccioná una fecha de entrega.");
        return;
      }

      if (!["delivery", "pickup"].includes(formState.deliveryMethod)) {
        setErrorMessage("Seleccioná un método de entrega válido.");
        return;
      }

      if (formState.deliveryMethod === "delivery" && !formState.address.trim()) {
        setErrorMessage("Ingresá la dirección de entrega.");
        return;
      }

      const payload: CreateOrderPayload = {
        p_business_id: business.id,
        p_customer_name: formState.customerName.trim(),
        p_phone: formState.phone.trim(),
        p_delivery_date: formState.deliveryDate,
        p_delivery_method: formState.deliveryMethod,
        p_address:
          formState.deliveryMethod === "delivery"
            ? formState.address.trim()
            : null,
        p_notes: formState.notes.trim() ? formState.notes.trim() : null,
        p_items: cartItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity
        }))
      };

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("create_order", payload);

      if (error) {
        setErrorMessage(error.message || "Algo salió mal, intentá de nuevo.");
        return;
      }

      if (typeof data !== "string" || !data) {
        setErrorMessage("No pudimos obtener el identificador del pedido.");
        return;
      }

      window.localStorage.removeItem(storageKey);
      router.push(`/b/${slug}/success?order_id=${encodeURIComponent(data)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <header className="checkout-header">
          <div>
            <p className="catalog-eyebrow">Checkout</p>
            <h1>{business.name}</h1>
          </div>
        </header>

        <section className="checkout-empty-state">
          <Card className="checkout-panel checkout-panel--empty">
            <div className="checkout-panel-header">
              <h2>Tu carrito está vacío</h2>
              <p>Para continuar con el pedido, primero agregá productos desde el catálogo.</p>
            </div>

            <Link className="checkout-empty-button" href={`/b/${slug}/catalogo`}>
              Volver al catálogo
            </Link>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <div className="checkout-header-copy">
          <p className="catalog-eyebrow">Checkout</p>
          <h1>{business.name}</h1>
        </div>
        <Link className="checkout-backlink" href={`/b/${slug}/catalogo`}>
          Volver al catálogo
        </Link>
      </header>

      <div className="checkout-layout">
        <Card className="checkout-panel">
          <div className="checkout-panel-header">
            <h2>Datos del pedido</h2>
            <p>Completá la información para preparar tu pedido.</p>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <section className="checkout-form-section">
              <div className="checkout-form-section-header">
                <h3>Datos del cliente</h3>
                <p>Así sabemos a nombre de quién preparar el pedido.</p>
              </div>

              <div className="checkout-form-grid">
                <Input
                  label="Nombre"
                  name="customer_name"
                  type="text"
                  value={formState.customerName}
                  onChange={(event) => handleFieldChange("customerName", event.target.value)}
                  required
                />

                <Input
                  label="Teléfono"
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  required
                />
              </div>
            </section>

            <section className="checkout-form-section">
              <div className="checkout-form-section-header">
                <h3>Entrega</h3>
                <p>Elegí cómo querés recibir el pedido y cuándo lo necesitás.</p>
              </div>

              <div className="checkout-form-grid">
                <Input
                  label="Fecha de entrega"
                  name="delivery_date"
                  type="date"
                  min={today}
                  value={formState.deliveryDate}
                  onChange={(event) => handleFieldChange("deliveryDate", event.target.value)}
                  required
                />

                <label className="ui-field" htmlFor="delivery_method">
                  <span className="ui-label">Método de entrega</span>
                  <select
                    id="delivery_method"
                    className="ui-input"
                    name="delivery_method"
                    value={formState.deliveryMethod}
                    onChange={(event) =>
                      handleFieldChange(
                        "deliveryMethod",
                        event.target.value as CheckoutFormState["deliveryMethod"]
                      )
                    }
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Retiro</option>
                  </select>
                </label>
              </div>

              {formState.deliveryMethod === "delivery" ? (
                <Input
                  label="Dirección"
                  name="address"
                  type="text"
                  value={formState.address}
                  onChange={(event) => handleFieldChange("address", event.target.value)}
                  required
                />
              ) : null}
            </section>

            <section className="checkout-form-section">
              <div className="checkout-form-section-header">
                <h3>Notas</h3>
                <p>Si hace falta, dejá una aclaración para el negocio.</p>
              </div>

              <label className="ui-field" htmlFor="notes">
                <span className="ui-label">Notas</span>
                <textarea
                  id="notes"
                  className="ui-input checkout-textarea"
                  name="notes"
                  rows={4}
                  value={formState.notes}
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                />
              </label>
            </section>

            {errorMessage ? (
              <p className="checkout-message checkout-message--error">{errorMessage}</p>
            ) : null}
            {statusMessage ? (
              <p className="checkout-message checkout-message--success">{statusMessage}</p>
            ) : null}

            <Button
              type="submit"
              className="checkout-submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Enviar pedido"}
            </Button>
          </form>
        </Card>

        <Card className="checkout-panel checkout-panel--summary">
          <div className="checkout-panel-header">
            <h2>Resumen del pedido</h2>
            <p>
              {cartCount} producto{cartCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="checkout-summary-list">
            {cartItems.map((item) => (
              <article key={item.productId} className="checkout-summary-item">
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </article>
            ))}

            <div className="checkout-summary-total">
              <span>Total</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
