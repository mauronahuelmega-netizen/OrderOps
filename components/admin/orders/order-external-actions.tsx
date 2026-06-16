"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import Button from "@/components/ui/Button";
import {
  canUseWebShare,
  copyTextToClipboard,
  shareText
} from "@/lib/browser/client-actions";
import {
  buildAdminOrderWhatsappUrl,
  buildOrderCallUrl,
  buildOrderContactSummary,
  buildOrderMapsUrl,
  getWhatsappTemplatesForOrder,
  type AdminOrderWhatsappTemplateKey
} from "@/lib/whatsapp/admin";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import detailStyles from "./order-detail-surfaces.module.css";

type OrderExternalActionsProps = {
  order: AdminOrderWorkspaceData;
};

export default function OrderExternalActions({ order }: OrderExternalActionsProps) {
  const { pushToast } = useAdminToast();
  const [selectedTemplate, setSelectedTemplate] =
    useState<AdminOrderWhatsappTemplateKey | "">("");
  const [canShareOrder, setCanShareOrder] = useState(false);

  const whatsappTemplates = useMemo(() => getWhatsappTemplatesForOrder(order), [order]);
  const selectedWhatsappTemplate =
    whatsappTemplates.find((template) => template.key === selectedTemplate) ??
    whatsappTemplates[0] ??
    null;
  const whatsappUrl =
    order.phone && selectedWhatsappTemplate
      ? buildAdminOrderWhatsappUrl({
          customerPhone: order.phone,
          message: selectedWhatsappTemplate.message
        })
      : null;
  const orderSummary = useMemo(() => buildOrderContactSummary(order), [order]);
  const mapsUrl = order.address?.trim() ? buildOrderMapsUrl(order.address) : null;
  const callUrl = order.phone ? buildOrderCallUrl(order.phone) : null;

  useEffect(() => {
    setSelectedTemplate(whatsappTemplates[0]?.key ?? "");
  }, [whatsappTemplates]);

  useEffect(() => {
    setCanShareOrder(canUseWebShare());
  }, []);

  const copyValue = async (value: string, successMessage: string) => {
    try {
      const copied = await copyTextToClipboard(value);

      if (!copied) {
        throw new Error("Clipboard unavailable");
      }

      pushToast({
        tone: "success",
        message: successMessage
      });
    } catch {
      pushToast({
        tone: "error",
        message: "No pudimos copiar"
      });
    }
  };

  const handleShareOrder = async () => {
    const result = await shareText({
      title: `Pedido de ${order.customer_name}`,
      text: orderSummary
    });

    if (result === "error") {
      pushToast({
        tone: "error",
        message: "No pudimos compartir"
      });
    }
  };

  const showWhatsappBlock = whatsappTemplates.length > 0 && Boolean(order.phone);

  return (
    <div className={detailStyles.externalActions}>
      {showWhatsappBlock ? (
        <>
          <div className={detailStyles.messageBlock}>
            <label className={`admin-field ${detailStyles.whatsappField}`}>
              <span>WhatsApp</span>
              <select
                value={selectedTemplate}
                onChange={(event) =>
                  setSelectedTemplate(event.target.value as AdminOrderWhatsappTemplateKey)
                }
              >
                {whatsappTemplates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {whatsappUrl ? (
            <div className={detailStyles.primaryCommunication}>
              <Button
                className={`${detailStyles.toolButton} ${detailStyles.toolButtonPrimary}`}
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                variant="accent"
              >
                Abrir WhatsApp
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <div className={detailStyles.quickActions}>
        <p className={detailStyles.quickActionsTitle}>Acciones rápidas</p>
        <div className={detailStyles.quickActionsGrid}>
          {order.phone ? (
            <button
              type="button"
              className={`ui-button ui-button--secondary ${detailStyles.toolButton} ${detailStyles.toolButtonSecondary}`}
              onClick={() => copyValue(order.phone!, "Telefono copiado")}
            >
              Copiar telefono
            </button>
          ) : null}

          {callUrl ? (
            <Button
              className={`${detailStyles.toolButton} ${detailStyles.toolButtonSecondary}`}
              href={callUrl}
              variant="secondary"
            >
              Llamar
            </Button>
          ) : null}

          {order.address?.trim() ? (
            <button
              type="button"
              className={`ui-button ui-button--secondary ${detailStyles.toolButton} ${detailStyles.toolButtonSecondary}`}
              onClick={() => copyValue(order.address!, "Direccion copiada")}
            >
              Copiar direccion
            </button>
          ) : null}

          {mapsUrl ? (
            <Button
              className={`${detailStyles.toolButton} ${detailStyles.toolButtonSecondary}`}
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              variant="secondary"
            >
              Abrir Maps
            </Button>
          ) : null}

          <button
            type="button"
            className={`ui-button ui-button--secondary ${detailStyles.toolButton} ${detailStyles.toolButtonSecondary}`}
            onClick={() => copyValue(orderSummary, "Resumen copiado")}
          >
            Copiar resumen
          </button>

          {canShareOrder ? (
            <button
              type="button"
              className={`ui-button ui-button--ghost ${detailStyles.toolButton} ${detailStyles.toolButtonSecondary}`}
              onClick={handleShareOrder}
            >
              Compartir
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
