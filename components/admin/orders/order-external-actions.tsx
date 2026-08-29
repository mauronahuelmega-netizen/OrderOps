"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";
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
  getPreferredWhatsappTemplateKeyForOrder,
  getWhatsappTemplatesForOrder,
  resolveWhatsappTemplateKey,
  type AdminOrderWhatsappTemplateKey
} from "@/lib/whatsapp/admin";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import detailStyles from "./order-detail-surfaces.module.css";
import workspaceStyles from "./order-external-actions.module.css";

type OrderExternalActionsProps = {
  order: AdminOrderWorkspaceData;
  /** Workstation rail: hide duplicate channel heading and demote WhatsApp CTA. */
  compactContact?: boolean;
  /**
   * Workspace-only: default template from status + delivery_method.
   * Detail / shared surfaces keep list-position default when false.
   */
  contextualTemplateDefault?: boolean;
  /**
   * Workspace-only Contact messaging hierarchy (template → WhatsApp → Copy/Share,
   * utilities separated). Detail keeps legacy layout when omitted / "default".
   */
  presentation?: "default" | "workspace";
};

function resolveContextualDefault(
  order: Pick<AdminOrderWorkspaceData, "status" | "delivery_method">,
  availableKeys: readonly AdminOrderWhatsappTemplateKey[]
) {
  const preferredKey = getPreferredWhatsappTemplateKeyForOrder({
    status: order.status,
    deliveryMethod: order.delivery_method
  });

  return resolveWhatsappTemplateKey(preferredKey, availableKeys);
}

export default function OrderExternalActions({
  order,
  compactContact = false,
  contextualTemplateDefault = false,
  presentation = "default"
}: OrderExternalActionsProps) {
  const { pushToast } = useAdminToast();
  const isWorkspacePresentation = presentation === "workspace";
  const whatsappTemplates = useMemo(() => getWhatsappTemplatesForOrder(order), [order]);
  // Keys depend only on status + delivery_method; avoid resetting on order object churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- semantic deps for selection contract
  const availableTemplateKeys = useMemo((): AdminOrderWhatsappTemplateKey[] => {
    return getWhatsappTemplatesForOrder(order).map((template) => template.key);
  }, [order.status, order.delivery_method]);

  const [selectedTemplate, setSelectedTemplate] = useState<AdminOrderWhatsappTemplateKey | "">(
    () =>
      contextualTemplateDefault
        ? resolveContextualDefault(order, availableTemplateKeys)
        : (whatsappTemplates[0]?.key ?? "")
  );
  const [canShareOrder, setCanShareOrder] = useState(false);

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
    if (contextualTemplateDefault) {
      return;
    }

    setSelectedTemplate(whatsappTemplates[0]?.key ?? "");
  }, [contextualTemplateDefault, whatsappTemplates]);

  useLayoutEffect(() => {
    if (!contextualTemplateDefault) {
      return;
    }

    setSelectedTemplate(resolveContextualDefault(order, availableTemplateKeys));
  }, [
    contextualTemplateDefault,
    order.id,
    order.status,
    order.delivery_method,
    availableTemplateKeys
  ]);

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
  const hasPhoneUtility = Boolean(order.phone);
  const hasCallUtility = Boolean(callUrl);
  const hasAddressUtility = Boolean(order.address?.trim());
  const hasMapsUtility = Boolean(mapsUrl);
  const utilityCount =
    Number(hasPhoneUtility) +
    Number(hasCallUtility) +
    Number(hasAddressUtility) +
    Number(hasMapsUtility);
  const showUtilitiesGroup = utilityCount > 0;

  if (isWorkspacePresentation) {
    const messagingSecondaryCount = 1 + Number(canShareOrder);

    return (
      <div className={workspaceStyles.workspaceRoot}>
        <div className={workspaceStyles.messagingGroup}>
          {showWhatsappBlock ? (
            <>
              <div className={workspaceStyles.selectShell}>
                <label className={`admin-field ${workspaceStyles.selectField}`}>
                  <span className="sr-only">WhatsApp</span>
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
                <ChevronDown className={workspaceStyles.selectChevron} aria-hidden="true" />
              </div>

              {whatsappUrl ? (
                <div className={workspaceStyles.whatsappPrimary}>
                  <Button
                    className={`${detailStyles.toolButton} ${workspaceStyles.whatsappButton}`}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                  >
                    <MessageCircle className={workspaceStyles.whatsappIcon} aria-hidden="true" />
                    Abrir WhatsApp
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}

          <div
            className={[
              workspaceStyles.messagingSecondary,
              messagingSecondaryCount === 1 ? workspaceStyles.messagingSecondarySolo : null
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <button
              type="button"
              className={workspaceStyles.messagingSecondaryAction}
              onClick={() => copyValue(orderSummary, "Resumen copiado")}
            >
              <Copy className={workspaceStyles.messagingSecondaryIcon} aria-hidden="true" />
              Copiar resumen
            </button>

            {canShareOrder ? (
              <button
                type="button"
                className={workspaceStyles.messagingSecondaryAction}
                onClick={handleShareOrder}
              >
                <Share2 className={workspaceStyles.messagingSecondaryIcon} aria-hidden="true" />
                Compartir
              </button>
            ) : null}
          </div>
        </div>

        {showUtilitiesGroup ? (
          <div className={workspaceStyles.utilitiesGroup}>
            <p className={workspaceStyles.utilitiesTitle}>Más acciones</p>
            <div
              className={[
                workspaceStyles.utilitiesGrid,
                utilityCount === 1 ? workspaceStyles.utilitiesGridSolo : null
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {hasPhoneUtility ? (
                <button
                  type="button"
                  className={workspaceStyles.utilityTool}
                  onClick={() => copyValue(order.phone!, "Telefono copiado")}
                >
                  <Copy className={workspaceStyles.utilityIcon} aria-hidden="true" />
                  <span className={workspaceStyles.utilityLabel}>Copiar telefono</span>
                </button>
              ) : null}

              {hasCallUtility ? (
                <a className={workspaceStyles.utilityTool} href={callUrl!}>
                  <Phone className={workspaceStyles.utilityIcon} aria-hidden="true" />
                  <span className={workspaceStyles.utilityLabel}>Llamar</span>
                </a>
              ) : null}

              {hasAddressUtility ? (
                <button
                  type="button"
                  className={workspaceStyles.utilityTool}
                  onClick={() => copyValue(order.address!, "Direccion copiada")}
                >
                  <Copy className={workspaceStyles.utilityIcon} aria-hidden="true" />
                  <span className={workspaceStyles.utilityLabel}>Copiar direccion</span>
                </button>
              ) : null}

              {hasMapsUtility ? (
                <a
                  className={workspaceStyles.utilityTool}
                  href={mapsUrl!}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className={workspaceStyles.utilityIcon} aria-hidden="true" />
                  <span className={workspaceStyles.utilityLabel}>Abrir Maps</span>
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={detailStyles.externalActions}>
      {showWhatsappBlock ? (
        <>
          <div className={detailStyles.messageBlock}>
            <label className={`admin-field ${detailStyles.whatsappField}`}>
              <span className={compactContact ? "sr-only" : undefined}>WhatsApp</span>
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
                className={[
                  detailStyles.toolButton,
                  compactContact ? detailStyles.whatsappAction : detailStyles.toolButtonPrimary
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                variant={compactContact ? "secondary" : "accent"}
              >
                Abrir WhatsApp
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <div className={detailStyles.quickActions}>
        <p className={detailStyles.quickActionsTitle}>Más acciones</p>
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
