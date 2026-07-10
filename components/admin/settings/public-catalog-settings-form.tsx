"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import PublicPresencePreview from "@/components/admin/settings/public-presence-preview";
import PublicPresenceReadiness from "@/components/admin/settings/public-presence-readiness";
import { updateCatalogHeroSettingsAction } from "@/app/admin/(protected)/settings/public/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

type PublicCatalogSettingsFormProps = {
  businessName: string;
  publicLandingHref?: string | null;
  initialValues: {
    badge: string | null;
    headline: string | null;
    microcopy: string | null;
  };
  publishedPresence?: {
    logoUrl: string | null;
    coverImageUrl: string | null;
    primaryColor: string | null;
    description: string | null;
    instagramUrl: string | null;
  };
  publication?: {
    slug: string | null;
    publicUrl: string | null;
  };
};

const initialState: ActionState = {};

export default function PublicCatalogSettingsForm({
  businessName,
  publicLandingHref = null,
  initialValues,
  publishedPresence,
  publication
}: PublicCatalogSettingsFormProps) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initialValues.headline ?? "");
  const [badge, setBadge] = useState(initialValues.badge ?? "");
  const [microcopy, setMicrocopy] = useState(initialValues.microcopy ?? "");
  const [state, formAction, isPending] = useActionState(
    updateCatalogHeroSettingsAction,
    initialState
  );

  useEffect(() => {
    setHeadline(initialValues.headline ?? "");
    setBadge(initialValues.badge ?? "");
    setMicrocopy(initialValues.microcopy ?? "");
  }, [initialValues.badge, initialValues.headline, initialValues.microcopy]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const publishedHeadline = initialValues.headline ?? "";
  const publishedBadge = initialValues.badge ?? "";
  const publishedMicrocopy = initialValues.microcopy ?? "";

  const hasUnsavedHeadlineChange = headline !== publishedHeadline;
  const hasUnsavedBadgeChange = badge !== publishedBadge;
  const hasUnsavedMicrocopyChange = microcopy !== publishedMicrocopy;

  const hasPendingChanges =
    hasUnsavedHeadlineChange || hasUnsavedBadgeChange || hasUnsavedMicrocopyChange;

  const pendingChangeLabels = [
    hasUnsavedHeadlineChange ? "Título del catálogo" : null,
    hasUnsavedBadgeChange ? "Badge" : null,
    hasUnsavedMicrocopyChange ? "Microcopy" : null
  ].filter((label): label is string => Boolean(label));

  const showSavedState = state.success && !hasPendingChanges && !isPending;

  const submitButtonLabel = isPending
    ? "Guardando..."
    : showSavedState
      ? "Guardado"
      : hasPendingChanges
        ? "Guardar cambios"
        : "Sin cambios";

  const isSubmitDisabled = isPending || !hasPendingChanges;

  return (
    <form action={formAction} className="admin-settings-public-form admin-settings-catalog-editor">
      <div className="admin-settings-catalog-editor__layout">
        <div className="admin-settings-catalog-editor__form">
          <section className="admin-settings-section admin-settings-catalog-section">
            <div className="admin-settings-section__header">
              <h3 className="admin-settings-section__title">Textos del hero</h3>
              <p className="admin-settings-section__description">
                Ajustá los mensajes principales que ven tus clientes al entrar al catálogo.
              </p>
            </div>

            <div className="admin-settings-public-grid">
              <label className="ui-field" htmlFor="catalog_hero_headline">
                <span className="ui-label">Headline del catálogo</span>
                <textarea
                  id="catalog_hero_headline"
                  name="catalog_hero_headline"
                  className="ui-input admin-settings-public-textarea admin-settings-public-textarea--compact"
                  rows={3}
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  disabled={isPending}
                  placeholder="Listo para pedir."
                />
                <p className="ui-helper">
                  Texto principal que aparece debajo de la portada. Recomendado: corto y claro. Ideal:
                  45 a 60 caracteres. Si lo dejás vacío, se usará el texto predeterminado.
                </p>
              </label>

              <label className="ui-field" htmlFor="catalog_hero_badge">
                <span className="ui-label">Badge del catálogo</span>
                <input
                  id="catalog_hero_badge"
                  name="catalog_hero_badge"
                  className="ui-input"
                  type="text"
                  value={badge}
                  onChange={(event) => setBadge(event.target.value)}
                  disabled={isPending}
                  placeholder="Te confirmamos por WhatsApp"
                />
                <p className="ui-helper">
                  Mensaje breve de confianza. Ideal: hasta 35 caracteres. Si lo dejás vacío, se usará el
                  texto predeterminado.
                </p>
              </label>

              <label className="ui-field" htmlFor="catalog_hero_microcopy">
                <span className="ui-label">Microcopy del catálogo</span>
                <textarea
                  id="catalog_hero_microcopy"
                  name="catalog_hero_microcopy"
                  className="ui-input admin-settings-public-textarea admin-settings-public-textarea--compact"
                  rows={3}
                  value={microcopy}
                  onChange={(event) => setMicrocopy(event.target.value)}
                  disabled={isPending}
                  placeholder="Hacé tu pedido y seguimos por WhatsApp."
                />
                <p className="ui-helper">
                  Texto secundario debajo del badge. Ideal: hasta 80 caracteres. Si lo dejás vacío, se
                  usará el texto predeterminado.
                </p>
              </label>
            </div>
          </section>

          {hasPendingChanges ? (
            <div
              className="admin-settings-public-pending-notice"
              role="status"
              aria-live="polite"
            >
              <strong>Tenés cambios pendientes de publicar.</strong>
              <ul className="admin-settings-public-pending-notice-list">
                {pendingChangeLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {showSavedState ? (
            <p className="admin-feedback admin-feedback--success" role="status">
              Cambios publicados correctamente.
            </p>
          ) : null}

          <div className="admin-settings-form-actions admin-settings-catalog-editor__actions">
            <Button
              type="submit"
              className="admin-primary-button"
              variant="primary"
              disabled={isSubmitDisabled}
              aria-disabled={isSubmitDisabled}
            >
              {submitButtonLabel}
            </Button>
          </div>
        </div>

        <aside className="admin-settings-catalog-editor__preview">
          <div className="admin-settings-catalog-preview-panel">
            <PublicPresenceReadiness
              variant="compact"
              identity={{
                logoUrl: publishedPresence?.logoUrl,
                coverImageUrl: publishedPresence?.coverImageUrl,
                primaryColor: publishedPresence?.primaryColor
              }}
              landing={{
                description: publishedPresence?.description,
                instagramUrl: publishedPresence?.instagramUrl
              }}
              catalog={{
                headline,
                badge,
                microcopy,
                pendingHeadline: hasUnsavedHeadlineChange,
                pendingBadge: hasUnsavedBadgeChange,
                pendingMicrocopy: hasUnsavedMicrocopyChange
              }}
              publication={{
                slug: publication?.slug ?? null,
                publicUrl: publication?.publicUrl ?? null
              }}
            />

            <PublicPresencePreview
              defaultMode="catalog"
              businessName={businessName}
              logoUrl={publishedPresence?.logoUrl}
              coverImageUrl={publishedPresence?.coverImageUrl}
              primaryColor={publishedPresence?.primaryColor}
              landing={{
                description: publishedPresence?.description,
                instagramUrl: publishedPresence?.instagramUrl,
                publicUrl: publicLandingHref
              }}
              catalog={{
                headline,
                badge,
                microcopy,
                publicUrl: publication?.publicUrl ?? null
              }}
            />
          </div>
        </aside>
      </div>
    </form>
  );
}
