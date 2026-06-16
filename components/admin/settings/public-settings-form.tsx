"use client";

import type { CSSProperties } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updatePublicBusinessSettingsAction } from "@/app/admin/(protected)/settings/public/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActionState = {
  error?: string;
  success?: boolean;
};

type PublicSettingsFormProps = {
  businessId: string;
  initialValues: {
    logoUrl: string | null;
    description: string | null;
    primaryColor: string | null;
    coverImageUrl: string | null;
    instagramUrl: string | null;
  };
};

const initialState: ActionState = {};
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PublicSettingsForm({
  businessId,
  initialValues
}: PublicSettingsFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const logoUrlInputRef = useRef<HTMLInputElement>(null);
  const coverImageUrlInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialValues.logoUrl ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [primaryColor, setPrimaryColor] = useState(initialValues.primaryColor ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialValues.coverImageUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initialValues.instagramUrl ?? "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);
  const [coverStatus, setCoverStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [previewBusinessName, setPreviewBusinessName] = useState("Tu negocio");
  const [state, formAction, isPending] = useActionState(
    updatePublicBusinessSettingsAction,
    initialState
  );

  useEffect(() => {
    setLogoUrl(initialValues.logoUrl ?? "");
    setDescription(initialValues.description ?? "");
    setPrimaryColor(initialValues.primaryColor ?? "");
    setCoverImageUrl(initialValues.coverImageUrl ?? "");
    setInstagramUrl(initialValues.instagramUrl ?? "");
  }, [
    initialValues.coverImageUrl,
    initialValues.description,
    initialValues.instagramUrl,
    initialValues.logoUrl,
    initialValues.primaryColor
  ]);

  useEffect(() => {
    if (logoUrlInputRef.current) {
      logoUrlInputRef.current.value = logoUrl;
    }
  }, [logoUrl]);

  useEffect(() => {
    if (coverImageUrlInputRef.current) {
      coverImageUrlInputRef.current.value = coverImageUrl;
    }
  }, [coverImageUrl]);

  useEffect(() => {
    const businessTitle = formRef.current
      ?.closest(".admin-form-card")
      ?.querySelector(".admin-form-header h2")
      ?.textContent?.trim();

    if (businessTitle) {
      setPreviewBusinessName(businessTitle);
    }
  }, []);

  useEffect(() => {
    if (state.success) {
      setFormError(null);
      setLogoStatus((current) => current ?? (logoUrl ? "Logo guardado." : null));
      setCoverStatus((current) => current ?? (coverImageUrl ? "Portada guardada." : null));
      router.refresh();
    }
  }, [coverImageUrl, logoUrl, router, state.success]);

  const isUploadingAsset = isUploadingLogo || isUploadingCover;
  const previewDescription = description.trim() || "Conta brevemente que ofrece tu negocio.";
  const previewBrandColor = primaryColor.trim() || "#2563EB";
  const previewInitial = previewBusinessName.charAt(0).toUpperCase();

  return (
    <form
      ref={formRef}
      action={formAction}
      className="admin-settings-public-form"
      onSubmit={(event) => {
        if (isUploadingAsset) {
          event.preventDefault();
          setFormError("Espera a que termine la subida.");
          return;
        }

        const currentForm = formRef.current;

        if (!currentForm) {
          return;
        }

        const payload = new FormData(currentForm);
        const submittedLogoUrl = getHiddenInputValue(payload.get("logo_url"));
        const submittedCoverImageUrl = getHiddenInputValue(payload.get("cover_image_url"));

        if (logoUrl && submittedLogoUrl !== logoUrl) {
          event.preventDefault();
          setFormError("El logo todavia no quedo listo para guardarse. Proba de nuevo en un segundo.");
          return;
        }

        if (coverImageUrl && submittedCoverImageUrl !== coverImageUrl) {
          event.preventDefault();
          setFormError(
            "La imagen de portada todavia no quedo lista para guardarse. Proba de nuevo en un segundo."
          );
          return;
        }

        setFormError(null);
      }}
    >
      <input ref={logoUrlInputRef} type="hidden" name="logo_url" value={logoUrl} readOnly />
      <input
        ref={coverImageUrlInputRef}
        type="hidden"
        name="cover_image_url"
        value={coverImageUrl}
        readOnly
      />

      <section className="admin-settings-section">
        <div className="admin-settings-section__header">
          <h3 className="admin-settings-section__title">Identidad</h3>
          <p className="admin-settings-section__description">
            Defini como se reconoce visualmente tu negocio.
          </p>
        </div>

        <div className="admin-settings-public-assets">
          <label className="admin-field">
            <span>Logo del negocio</span>
            <div className="admin-settings-public-preview admin-settings-public-preview--logo">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo actual del negocio" />
              ) : (
                <div className="admin-settings-public-empty">Sin logo</div>
              )}
            </div>
            <div className="admin-settings-upload">
              <input
                id="logo-file"
                className="admin-settings-upload__input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isPending || isUploadingAsset}
                onChange={(event) =>
                  handleAssetUpload({
                    event,
                    businessId,
                    folder: "logo",
                    onUploadStart: () => {
                      setLogoError(null);
                      setFormError(null);
                      setLogoStatus("Subiendo logo...");
                      setIsUploadingLogo(true);
                    },
                    onUploadEnd: () => setIsUploadingLogo(false),
                    onUploaded: (url) => {
                      if (logoUrlInputRef.current) {
                        logoUrlInputRef.current.value = url;
                      }

                      setLogoUrl(url);
                      setLogoStatus("Logo listo para guardar.");
                    },
                    onError: (message) => {
                      setLogoError(message);
                      setLogoStatus(null);
                    }
                  })
                }
              />
              <div className="admin-settings-upload__control">
                <label className="admin-settings-upload__button" htmlFor="logo-file">
                  {logoUrl ? "Cambiar logo" : "Subir logo"}
                </label>
                <div className="admin-settings-upload__meta">
                  <p className="admin-settings-upload__hint">
                    Usá una imagen cuadrada, simple y legible. Se verá en el header, la landing y
                    el catálogo.
                  </p>
                  <p className="admin-settings-upload__hint">
                    Formatos: JPG, PNG o WebP. Máximo 5MB.
                  </p>
                  {!logoError && logoStatus ? (
                    <p className="admin-settings-upload__status admin-feedback admin-feedback--success">
                      {logoStatus}
                    </p>
                  ) : null}
                  {logoError ? (
                    <p className="admin-settings-upload__status admin-feedback admin-feedback--error">
                      {logoError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </label>

          <Input
            label="Color de marca"
            name="primary_color"
            type="text"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            disabled={isPending}
            placeholder="#2563EB"
            helperText="Usa un color hexadecimal en formato #RRGGBB."
          />
        </div>
      </section>

      <section className="admin-settings-section">
        <div className="admin-settings-section__header">
          <h3 className="admin-settings-section__title">Imagen de portada</h3>
          <p className="admin-settings-section__description">
            Elegi una imagen horizontal que represente tu negocio.
          </p>
        </div>

        <label className="admin-field">
          <span>Imagen de portada</span>
          <div className="admin-settings-public-preview admin-settings-public-preview--cover">
            {coverImageUrl ? (
              <img src={coverImageUrl} alt="Portada actual del negocio" />
            ) : (
              <div className="admin-settings-public-empty">Sin portada</div>
            )}
          </div>
          <div className="admin-settings-upload">
            <input
              id="cover-file"
              className="admin-settings-upload__input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isPending || isUploadingAsset}
              onChange={(event) =>
                handleAssetUpload({
                  event,
                  businessId,
                  folder: "cover",
                  onUploadStart: () => {
                    setCoverError(null);
                    setFormError(null);
                    setCoverStatus("Subiendo portada...");
                    setIsUploadingCover(true);
                  },
                  onUploadEnd: () => setIsUploadingCover(false),
                  onUploaded: (url) => {
                    if (coverImageUrlInputRef.current) {
                      coverImageUrlInputRef.current.value = url;
                    }

                    setCoverImageUrl(url);
                    setCoverStatus("Portada lista para guardar.");
                  },
                  onError: (message) => {
                    setCoverError(message);
                    setCoverStatus(null);
                  }
                })
              }
            />
            <div className="admin-settings-upload__control">
              <label className="admin-settings-upload__button" htmlFor="cover-file">
                {coverImageUrl ? "Cambiar portada" : "Subir portada"}
              </label>
              <div className="admin-settings-upload__meta">
                <p className="admin-settings-upload__hint">
                  Elegí una foto horizontal que muestre tu producto principal o el estilo de tu
                  negocio.
                </p>
                <p className="admin-settings-upload__hint">
                  Ideal: formato 16:9, buena luz y el producto centrado. JPG, PNG o WebP. Máximo
                  5MB.
                </p>
                {!coverError && coverStatus ? (
                  <p className="admin-settings-upload__status admin-feedback admin-feedback--success">
                    {coverStatus}
                  </p>
                ) : null}
                {coverError ? (
                  <p className="admin-settings-upload__status admin-feedback admin-feedback--error">
                    {coverError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </label>
      </section>

      <section className="admin-settings-section">
        <div className="admin-settings-section__header">
          <h3 className="admin-settings-section__title">Presentacion</h3>
          <p className="admin-settings-section__description">
            Conta brevemente que ofrece tu negocio y donde encontrarlo.
          </p>
        </div>

        <div className="admin-settings-public-grid">
          <label className="ui-field" htmlFor="description">
            <span className="ui-label">Presentacion del negocio</span>
            <textarea
              id="description"
              name="description"
              className="ui-input admin-settings-public-textarea"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isPending}
              placeholder="Conta brevemente que ofrece tu negocio."
            />
            <p className="ui-helper">Este texto aparece en la landing publica de tu negocio.</p>
          </label>

          <Input
            label="Instagram del negocio"
            name="instagram_url"
            type="url"
            value={instagramUrl}
            onChange={(event) => setInstagramUrl(event.target.value)}
            disabled={isPending}
            placeholder="https://instagram.com/tu-negocio"
            helperText="Podes dejarlo vacio si no queres mostrarlo todavia."
          />
        </div>
      </section>

      <section className="admin-settings-section">
        <div className="admin-settings-section__header">
          <h3 className="admin-settings-section__title">Vista previa</h3>
          <p className="admin-settings-section__description">
            Asi se vera la presentacion principal de tu negocio.
          </p>
        </div>

        <div className="admin-settings-preview" style={{ "--preview-brand": previewBrandColor } as CSSProperties}>
          <div className="admin-settings-preview__header">
            {logoUrl ? (
              <img
                className="admin-settings-preview__logo"
                src={logoUrl}
                alt="Vista previa del logo"
              />
            ) : (
              <div className="admin-settings-preview__logo admin-settings-preview__logo--placeholder">
                {previewInitial}
              </div>
            )}

            <div className="admin-settings-preview__content">
              <p className="admin-settings-preview__kicker">Pedido online</p>
              <strong className="admin-settings-preview__title">{previewBusinessName}</strong>
              <p className="admin-settings-preview__description">{previewDescription}</p>
            </div>
          </div>

          {coverImageUrl ? (
            <img
              className="admin-settings-preview__cover"
              src={coverImageUrl}
              alt="Vista previa de la portada"
            />
          ) : (
            <div className="admin-settings-preview__cover admin-settings-preview__cover--placeholder">
              Imagen de portada
            </div>
          )}

          <span className="admin-settings-preview__pill">Tu marca en foco</span>
        </div>
      </section>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {formError ? <p className="admin-feedback admin-feedback--error">{formError}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Configuracion guardada.</p>
      ) : null}

      <Button
        type="submit"
        className="admin-primary-button"
        variant="primary"
        disabled={isPending || isUploadingAsset}
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

async function handleAssetUpload(input: {
  event: React.ChangeEvent<HTMLInputElement>;
  businessId: string;
  folder: "logo" | "cover";
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
}) {
  const file = input.event.target.files?.[0];

  if (!file) {
    input.onError("");
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    input.onError("Subi una imagen JPG, PNG o WebP.");
    input.event.target.value = "";
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    input.onError("La imagen no puede pesar mas de 5MB.");
    input.event.target.value = "";
    return;
  }

  input.onUploadStart();

  try {
    const supabase = createSupabaseBrowserClient();
    const fileExt = getFileExtension(file.name);
    const filePath = `${input.businessId}/${input.folder}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(filePath, file, {
        contentType: file.type || undefined,
        upsert: true
      });

    if (uploadError) {
      input.onError(uploadError.message || "No pudimos subir la imagen.");
      return;
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from("business-assets").getPublicUrl(filePath);

    input.onUploaded(publicUrl);
    input.event.target.value = "";
  } finally {
    input.onUploadEnd();
  }
}

function getHiddenInputValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}
