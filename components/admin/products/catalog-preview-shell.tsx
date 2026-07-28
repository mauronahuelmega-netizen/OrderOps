"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  armCatalogPreviewCookieAction,
  clearCatalogPreviewCookieAction
} from "@/app/admin/(protected)/products/preview/actions";
import { buildPublicCatalogPath } from "@/lib/admin/catalog-preview-shared";
import { clearUnifiedCartItems } from "@/lib/cart/local";
import styles from "./catalog-preview-shell.module.css";

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
        <p>Tu negocio todavía no tiene una dirección pública configurada.</p>
        <p>Configurala antes de abrir la vista previa del catálogo.</p>
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
  const [cookieReady, setCookieReady] = useState(false);
  const [cookieError, setCookieError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [clearStatus, setClearStatus] = useState<"idle" | "cleared" | "error">("idle");
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

  const handleCopyPublicLink = useCallback(async () => {
    setCopyStatus("idle");
    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicCatalogPath}`
        : publicCatalogPath;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2500);
    }
  }, [publicCatalogPath]);

  const handleClearPreviewCart = useCallback(() => {
    setClearStatus("idle");
    try {
      clearUnifiedCartItems(businessId, "preview");
    } catch {
      setClearStatus("error");
      window.setTimeout(() => setClearStatus("idle"), 2500);
      return;
    }

    void clearCatalogPreviewCookieAction({ businessId, businessSlug }).then((result) => {
      if (result.ok) {
        setClearStatus("cleared");
        window.setTimeout(() => setClearStatus("idle"), 2000);
        return;
      }

      setClearStatus("error");
      window.setTimeout(() => setClearStatus("idle"), 2500);
    });
  }, [businessId, businessSlug]);

  return (
    <div className={styles.shell}>
      <p className={styles.banner} role="status">
        Estás viendo una vista previa móvil del catálogo. Podés probar productos, opciones y
        carrito de prueba. La confirmación de pedidos está deshabilitada en este modo.
      </p>

      <div className={styles.toolbar}>
        <Button
          type="button"
          variant="ghost"
          className="admin-ghost-link"
          onClick={handleClearPreviewCart}
        >
          Vaciar carrito de prueba
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="admin-ghost-link"
          onClick={handleCopyPublicLink}
        >
          Copiar link catálogo público
        </Button>
        {clearStatus === "cleared" ? (
          <span className={styles.status} role="status">
            Carrito de prueba vaciado
          </span>
        ) : null}
        {clearStatus === "error" ? (
          <span className={styles.statusError} role="status">
            No se pudo vaciar el carrito de prueba
          </span>
        ) : null}
        {copyStatus === "copied" ? (
          <span className={styles.status} role="status">
            Link copiado
          </span>
        ) : null}
        {copyStatus === "error" ? (
          <span className={styles.statusError} role="status">
            No se pudo copiar el link
          </span>
        ) : null}
      </div>

      {cookieError ? (
        <p className={styles.statusError} role="alert">
          No se pudo activar el modo preview de forma segura. Recargá la página e intentá
          nuevamente.
        </p>
      ) : null}

      {!cookieReady && !cookieError ? (
        <p className={styles.status} role="status">
          Preparando vista previa…
        </p>
      ) : null}

      {cookieReady ? (
        <div className={styles.stage}>
          <div className={styles.phoneFrame} aria-hidden="true">
            <div className={styles.phoneNotch} />
          </div>
          <div className={styles.iframeWrap}>
            <iframe
              className={styles.iframe}
              title="Vista previa del catálogo"
              src={iframeSrc}
              referrerPolicy="same-origin"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
