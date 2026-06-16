"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { updateCatalogHeroSettingsAction } from "@/app/admin/(protected)/settings/public/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

type PublicCatalogSettingsFormProps = {
  initialValues: {
    badge: string | null;
    headline: string | null;
    microcopy: string | null;
  };
};

const initialState: ActionState = {};

export default function PublicCatalogSettingsForm({
  initialValues
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

  const preview = useMemo(
    () => ({
      headline: headline.trim() || "Listo para pedir.",
      badge: badge.trim() || "Te confirmamos por WhatsApp",
      microcopy: microcopy.trim() || "Hacé tu pedido y seguimos por WhatsApp."
    }),
    [badge, headline, microcopy]
  );

  return (
    <form action={formAction} className="admin-settings-public-form">
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

      <div className="admin-settings-public-preview-copy">
        <p className="catalog-eyebrow">Pedí online</p>
        <strong>{preview.headline}</strong>
        <span>{preview.badge}</span>
        <small>{preview.microcopy}</small>
      </div>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Cambios guardados.</p>
      ) : null}

      <Button type="submit" className="admin-primary-button" variant="primary" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
