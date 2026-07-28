"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import {
  armCatalogPreviewCookieAction,
  clearCatalogPreviewCookieAction
} from "@/app/admin/(protected)/products/preview/actions";
import {
  ORDEROPS_PREVIEW_CLEAR_CART_ACK_MESSAGE,
  ORDEROPS_PREVIEW_CLEAR_CART_MESSAGE,
  buildPublicCatalogPath,
  type OrderOpsPreviewClearCartAckMessage,
  type OrderOpsPreviewClearCartMessage
} from "@/lib/admin/catalog-preview-shared";
import { clearUnifiedCartItems } from "@/lib/cart/local";
import styles from "./catalog-preview-shell.module.css";

const CLEAR_CART_ACK_TIMEOUT_MS = 1000;

const CHECKLIST_ITEMS = [
  "Navegar categorías",
  "Abrir productos",
  "Elegir opcionales y extras",
  "Agregar productos al carrito de prueba",
  "Llegar al checkout sin confirmar pedidos"
] as const;

type CatalogPreviewShellProps =
  | {
      mode: "empty";
    }
  | {
      mode: "preview";
      businessId: string;
      businessSlug: string;
      iframeSrc: string;
    };

export default function CatalogPreviewShell(props: CatalogPreviewShellProps) {
  if (props.mode === "empty") {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyTitle}>Sin dirección pública</p>
        <p>Tu negocio todavía no tiene una dirección pública configurada.</p>
        <p>Configurala antes de abrir la vista previa del catálogo.</p>
        <Button href="/admin/settings/public" variant="secondary" className={styles.emptyCta}>
          Ir a Presencia pública
        </Button>
      </div>
    );
  }

  return (
    <CatalogPreviewActiveShell
      businessId={props.businessId}
      businessSlug={props.businessSlug}
      iframeSrc={props.iframeSrc}
    />
  );
}

function CatalogPreviewActiveShell({
  businessId,
  businessSlug,
  iframeSrc
}: {
  businessId: string;
  businessSlug: string;
  iframeSrc: string;
}) {
  const { pushToast } = useAdminToast();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const clearAckWaitRef = useRef<{
    businessId: string;
    generation: number;
    resolve: (acked: boolean) => void;
  } | null>(null);
  const clearAckGenerationRef = useRef(0);

  const [cookieReady, setCookieReady] = useState(false);
  const [cookieError, setCookieError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const publicCatalogPath = buildPublicCatalogPath(businessSlug);

  useEffect(() => {
    let cancelled = false;

    void armCatalogPreviewCookieAction().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setCookieReady(true);
        setCookieError(false);
        return;
      }

      setCookieError(true);
      setCookieReady(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as OrderOpsPreviewClearCartAckMessage | null;
      if (!data || data.type !== ORDEROPS_PREVIEW_CLEAR_CART_ACK_MESSAGE) {
        return;
      }

      if (data.businessId !== businessId) {
        return;
      }

      const pending = clearAckWaitRef.current;
      if (!pending || pending.businessId !== businessId) {
        return;
      }

      clearAckWaitRef.current = null;
      pending.resolve(true);
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      clearAckWaitRef.current = null;
    };
  }, [businessId]);

  const waitForClearAck = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const previous = clearAckWaitRef.current;
      if (previous) {
        previous.resolve(false);
      }

      const generation = clearAckGenerationRef.current + 1;
      clearAckGenerationRef.current = generation;

      clearAckWaitRef.current = {
        businessId,
        generation,
        resolve
      };

      window.setTimeout(() => {
        const pending = clearAckWaitRef.current;
        if (!pending || pending.generation !== generation) {
          return;
        }
        clearAckWaitRef.current = null;
        pending.resolve(false);
      }, CLEAR_CART_ACK_TIMEOUT_MS);
    });
  }, [businessId]);

  const handleCopyPublicLink = useCallback(async () => {
    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicCatalogPath}`
        : publicCatalogPath;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      pushToast({
        tone: "success",
        message: "Link del catálogo copiado"
      });
    } catch {
      pushToast({
        tone: "error",
        message: "No se pudo copiar el link"
      });
    }
  }, [publicCatalogPath, pushToast]);

  const handleClearPreviewCart = useCallback(async () => {
    if (isClearingCart) {
      return;
    }

    setIsClearingCart(true);
    pushToast({
      tone: "info",
      message: "Vaciando carrito de prueba…"
    });

    try {
      clearUnifiedCartItems(businessId, "preview");
    } catch {
      setIsClearingCart(false);
      pushToast({
        tone: "error",
        message: "No se pudo vaciar el carrito de prueba"
      });
      return;
    }

    const message: OrderOpsPreviewClearCartMessage = {
      type: ORDEROPS_PREVIEW_CLEAR_CART_MESSAGE,
      businessId
    };

    const ackPromise = waitForClearAck();
    try {
      iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
    } catch {
      // Fall through to remount fallback.
    }

    const acked = await ackPromise;
    if (!acked) {
      setIframeLoaded(false);
      setIframeKey((current) => current + 1);
    }

    const cookieResult = await clearCatalogPreviewCookieAction({
      businessId,
      businessSlug
    });

    setIsClearingCart(false);

    if (!cookieResult.ok) {
      pushToast({
        tone: "error",
        message: "No se pudo vaciar el carrito de prueba"
      });
      return;
    }

    pushToast({
      tone: "success",
      message: "Carrito de prueba vaciado"
    });
  }, [
    businessId,
    businessSlug,
    isClearingCart,
    pushToast,
    waitForClearAck
  ]);

  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        <div className={styles.contentColumn}>
          <section className={styles.safety} aria-labelledby="catalog-preview-safety-title">
            <p className={styles.safetyEyebrow}>Modo seguro</p>
            <h2 id="catalog-preview-safety-title" className={styles.safetyTitle}>
              Modo seguro activo
            </h2>
            <p className={styles.safetyCopy}>
              Podés probar el catálogo, las opciones y el carrito. La confirmación de pedidos
              está deshabilitada en esta vista.
            </p>
            <p className={styles.safetySecondary}>
              No se crean pedidos reales desde la vista previa.
            </p>
          </section>

          <section className={styles.actions} aria-labelledby="catalog-preview-actions-title">
            <h2 id="catalog-preview-actions-title" className={styles.sectionTitle}>
              Acciones
            </h2>
            <div className={styles.actionsRow}>
              <Button
                type="button"
                variant="secondary"
                className={styles.clearAction}
                onClick={() => {
                  void handleClearPreviewCart();
                }}
                disabled={isClearingCart || !cookieReady}
              >
                {isClearingCart ? "Vaciando…" : "Vaciar carrito de prueba"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void handleCopyPublicLink();
                }}
              >
                Copiar link catálogo público
              </Button>
            </div>
            <p className={styles.actionsHint}>
              Estas acciones solo afectan esta vista previa. No modifican productos ni pedidos.
            </p>
          </section>

          <section className={styles.checklist} aria-labelledby="catalog-preview-checklist-title">
            <h2 id="catalog-preview-checklist-title" className={styles.sectionTitle}>
              Qué podés probar
            </h2>
            <ul className={styles.checklistList}>
              {CHECKLIST_ITEMS.map((item) => (
                <li key={item} className={styles.checklistItem}>
                  <span className={styles.checklistMark} aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.phoneColumn}>
          {cookieError ? (
            <div className={styles.stateCard} role="alert">
              <p className={styles.stateTitle}>No pudimos cargar la vista previa</p>
              <p className={styles.stateCopy}>
                No se pudo activar el modo preview de forma segura. Recargá la página e intentá
                nuevamente.
              </p>
            </div>
          ) : null}

          {!cookieReady && !cookieError ? (
            <div className={styles.stateCard} role="status">
              <p className={styles.stateTitle}>Preparando vista previa del catálogo…</p>
              <p className={styles.stateCopy}>
                Estamos cargando la experiencia móvil con carrito de prueba aislado.
              </p>
            </div>
          ) : null}

          {cookieReady ? (
            <div className={styles.phoneSticky}>
              <div className={styles.stage}>
                <div className={styles.phoneFrame}>
                  <div className={styles.phoneNotch} aria-hidden="true" />
                  <div className={styles.iframeWrap}>
                    {!iframeLoaded ? (
                      <div className={styles.iframeLoading} role="status">
                        <p>Cargando catálogo…</p>
                      </div>
                    ) : null}
                    <iframe
                      key={iframeKey}
                      ref={iframeRef}
                      className={styles.iframe}
                      title="Vista previa del catálogo"
                      src={iframeSrc}
                      referrerPolicy="same-origin"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
