"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        setErrorMessage("Tu carrito esta vacio.");
        return;
      }

      if (!formState.customerName.trim()) {
        setErrorMessage("Ingresa tu nombre.");
        return;
      }

      if (!formState.phone.trim()) {
        setErrorMessage("Ingresa tu telefono.");
        return;
      }

      if (!formState.deliveryDate) {
        setErrorMessage("Selecciona una fecha de entrega.");
        return;
      }

      if (!["delivery", "pickup"].includes(formState.deliveryMethod)) {
        setErrorMessage("Selecciona un metodo de entrega valido.");
        return;
      }

      if (formState.deliveryMethod === "delivery" && !formState.address.trim()) {
        setErrorMessage("Ingresa la direccion de entrega.");
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
        setErrorMessage(error.message || "No pudimos registrar tu pedido.");
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
          <div className="checkout-panel checkout-panel--empty">
            <div className="checkout-panel-header">
              <h2>Tu carrito esta vacio</h2>
              <p>Para continuar con el pedido, primero agrega productos desde el catalogo.</p>
            </div>

            <Link className="checkout-empty-button" href={`/b/${slug}`}>
              Volver al catalogo
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <div>
          <p className="catalog-eyebrow">Checkout</p>
          <h1>{business.name}</h1>
        </div>
        <Link className="checkout-backlink" href={`/b/${slug}`}>
          Volver al catalogo
        </Link>
      </header>

      <div className="checkout-layout">
        <section className="checkout-panel">
          <div className="checkout-panel-header">
            <h2>Datos del pedido</h2>
            <p>Completa la informacion para preparar tu pedido.</p>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <label className="checkout-field">
              <span>Nombre</span>
              <input
                name="customer_name"
                type="text"
                value={formState.customerName}
                onChange={(event) => handleFieldChange("customerName", event.target.value)}
                required
              />
            </label>

            <label className="checkout-field">
              <span>Telefono</span>
              <input
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={(event) => handleFieldChange("phone", event.target.value)}
                required
              />
            </label>

            <label className="checkout-field">
              <span>Fecha de entrega</span>
              <input
                name="delivery_date"
                type="date"
                min={today}
                value={formState.deliveryDate}
                onChange={(event) => handleFieldChange("deliveryDate", event.target.value)}
                required
              />
            </label>

            <label className="checkout-field">
              <span>Metodo de entrega</span>
              <select
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

            {formState.deliveryMethod === "delivery" ? (
              <label className="checkout-field">
                <span>Direccion</span>
                <input
                  name="address"
                  type="text"
                  value={formState.address}
                  onChange={(event) => handleFieldChange("address", event.target.value)}
                  required
                />
              </label>
            ) : null}

            <label className="checkout-field">
              <span>Notas</span>
              <textarea
                name="notes"
                rows={4}
                value={formState.notes}
                onChange={(event) => handleFieldChange("notes", event.target.value)}
              />
            </label>

            {errorMessage ? <p className="checkout-message checkout-message--error">{errorMessage}</p> : null}
            {statusMessage ? (
              <p className="checkout-message checkout-message--success">{statusMessage}</p>
            ) : null}

            <button
              type="submit"
              className="checkout-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando pedido..." : "Continuar"}
            </button>
          </form>
        </section>

        <aside className="checkout-panel checkout-panel--summary">
          <div className="checkout-panel-header">
            <h2>Resumen</h2>
            <p>{cartCount} item(s)</p>
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
        </aside>
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
