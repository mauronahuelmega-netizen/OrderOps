"use client";

import type { FormEvent } from "react";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PublicAssetUpload, {
  type PublicAssetUploadState
} from "@/components/admin/settings/public-asset-upload";
import BrandPaletteControl from "@/components/admin/settings/brand-palette-control";
import { normalizeHexColor } from "@/components/admin/settings/brand-palette";
import PublicPresenceReadiness from "@/components/admin/settings/public-presence-readiness";
import PublicPresencePreview from "@/components/admin/settings/public-presence-preview";
import { updatePublicBusinessSettingsAction } from "@/app/admin/(protected)/settings/public/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActionState = {
  error?: string;
  success?: boolean;
};

type PublicSettingsFormProps = {
  businessId: string;
  businessName: string;
  publicLandingHref?: string | null;
  publicCatalogHref?: string | null;
  initialValues: {
    logoUrl: string | null;
    description: string | null;
    primaryColor: string | null;
    coverImageUrl: string | null;
    instagramUrl: string | null;
  };
  publishedCatalog?: {
    headline: string | null;
    badge: string | null;
    microcopy: string | null;
  };
  publication?: {
    slug: string | null;
    publicUrl: string | null;
  };
};

const initialState: ActionState = {};
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const LOGO_HINT =
  "Usá una imagen cuadrada y fácil de reconocer. Se verá en el header, la landing y el catálogo. JPG, PNG o WebP. Máximo 5 MB.";

const COVER_HINT =
  "Elegí una imagen horizontal que represente lo primero que tus clientes van a ver. Ideal: 16:9, buena luz y producto centrado. JPG, PNG o WebP. Máximo 5 MB.";

export default function PublicSettingsForm({
  businessId,
  businessName,
  publicLandingHref = null,
  publicCatalogHref = null,
  initialValues,
  publishedCatalog,
  publication
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
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreviewUrl, setPendingLogoPreviewUrl] = useState<string | null>(null);
  const [pendingLogoMetadata, setPendingLogoMetadata] = useState<string | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverPreviewUrl, setPendingCoverPreviewUrl] = useState<string | null>(null);
  const [pendingCoverMetadata, setPendingCoverMetadata] = useState<string | null>(null);
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
    setPendingLogoPreviewUrl((current) => {
      revokeObjectUrl(current);
      return null;
    });
    setPendingCoverPreviewUrl((current) => {
      revokeObjectUrl(current);
      return null;
    });
    setPendingLogoFile(null);
    setPendingCoverFile(null);
    setPendingLogoMetadata(null);
    setPendingCoverMetadata(null);
    setLogoStatus(null);
    setCoverStatus(null);
    setLogoError(null);
    setCoverError(null);
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
    return () => {
      revokeObjectUrl(pendingLogoPreviewUrl);
      revokeObjectUrl(pendingCoverPreviewUrl);
    };
  }, [pendingCoverPreviewUrl, pendingLogoPreviewUrl]);

  useEffect(() => {
    if (state.success) {
      setFormError(null);
      clearPendingLogo();
      clearPendingCover();
      setLogoStatus((current) => current ?? (logoUrl ? "Logo guardado." : null));
      setCoverStatus((current) => current ?? (coverImageUrl ? "Portada guardada." : null));
      router.refresh();
    }
  }, [coverImageUrl, logoUrl, router, state.success]);

  const isUploadingAsset = isUploadingLogo || isUploadingCover;
  const publishedPrimaryColor = initialValues.primaryColor ?? "";
  const displayLogoSrc = pendingLogoPreviewUrl ?? (logoUrl || null);
  const displayCoverSrc = pendingCoverPreviewUrl ?? (coverImageUrl || null);

  const logoUploadState = getAssetUploadState({
    hasPublishedAsset: Boolean(logoUrl),
    hasPendingFile: Boolean(pendingLogoFile),
    isUploading: isUploadingLogo
  });

  const coverUploadState = getAssetUploadState({
    hasPublishedAsset: Boolean(coverImageUrl),
    hasPendingFile: Boolean(pendingCoverFile),
    isUploading: isUploadingCover
  });

  const publishedDescription = initialValues.description ?? "";
  const publishedInstagram = initialValues.instagramUrl ?? "";
  const publishedColorNormalized = normalizeHexColor(initialValues.primaryColor ?? "");
  const currentColorNormalized = normalizeHexColor(primaryColor);

  const hasPendingLogo = Boolean(pendingLogoFile);
  const hasPendingCover = Boolean(pendingCoverFile);
  const hasUnsavedColorChange = currentColorNormalized !== publishedColorNormalized;
  const hasUnsavedDescriptionChange = description !== publishedDescription;
  const hasUnsavedInstagramChange = instagramUrl !== publishedInstagram;

  const hasPendingChanges =
    hasPendingLogo ||
    hasPendingCover ||
    hasUnsavedColorChange ||
    hasUnsavedDescriptionChange ||
    hasUnsavedInstagramChange;

  const pendingChangeLabels = [
    hasPendingLogo ? "Logo" : null,
    hasPendingCover ? "Portada" : null,
    hasUnsavedColorChange ? "Color" : null,
    hasUnsavedDescriptionChange ? "Descripción" : null,
    hasUnsavedInstagramChange ? "Instagram" : null
  ].filter((label): label is string => Boolean(label));

  const showSavedState = state.success && !hasPendingChanges && !isPending && !isUploadingAsset;

  const submitButtonLabel = isUploadingAsset
    ? "Subiendo imágenes..."
    : isPending
      ? "Guardando..."
      : showSavedState
        ? "Guardado"
        : hasPendingChanges
          ? "Guardar cambios"
          : "Sin cambios";

  const isSubmitDisabled = isPending || isUploadingAsset || !hasPendingChanges;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending || isUploadingAsset) {
      return;
    }

    setFormError(null);

    try {
      let nextLogoUrl = logoUrl;
      let nextCoverUrl = coverImageUrl;

      if (pendingLogoFile) {
        setIsUploadingLogo(true);
        setLogoStatus("Subiendo logo...");
        nextLogoUrl = await uploadBusinessAsset(pendingLogoFile, businessId, "logo");
        clearPendingLogo();
        setLogoUrl(nextLogoUrl);
        setIsUploadingLogo(false);
      }

      if (pendingCoverFile) {
        setIsUploadingCover(true);
        setCoverStatus("Subiendo portada...");
        nextCoverUrl = await uploadBusinessAsset(pendingCoverFile, businessId, "cover");
        clearPendingCover();
        setCoverImageUrl(nextCoverUrl);
        setIsUploadingCover(false);
      }

      const currentForm = formRef.current;

      if (!currentForm) {
        return;
      }

      const formData = new FormData(currentForm);
      formData.set("logo_url", nextLogoUrl);
      formData.set("cover_image_url", nextCoverUrl);
      const normalizedPrimaryColor = normalizeHexColor(primaryColor);
      formData.set("primary_color", normalizedPrimaryColor ?? "");
      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setIsUploadingLogo(false);
      setIsUploadingCover(false);
      setFormError(
        error instanceof Error ? error.message : "No pudimos preparar las imágenes para guardar."
      );
    }
  }

  async function handleLogoFileSelected(file: File) {
    const validationError = validateImageFile(file);

    if (validationError) {
      setLogoError(validationError);
      setLogoStatus(null);
      return false;
    }

    clearPendingLogo();
    const previewUrl = URL.createObjectURL(file);
    setPendingLogoFile(file);
    setPendingLogoPreviewUrl(previewUrl);
    setPendingLogoMetadata(await buildFileMetadata(file));
    setLogoError(null);
    setLogoStatus("Imagen seleccionada. Guardá cambios para publicarla.");
  }

  async function handleCoverFileSelected(file: File) {
    const validationError = validateImageFile(file);

    if (validationError) {
      setCoverError(validationError);
      setCoverStatus(null);
      return false;
    }

    clearPendingCover();
    const previewUrl = URL.createObjectURL(file);
    setPendingCoverFile(file);
    setPendingCoverPreviewUrl(previewUrl);
    setPendingCoverMetadata(await buildFileMetadata(file, true));
    setCoverError(null);
    setCoverStatus("Imagen seleccionada. Guardá cambios para publicarla.");
  }

  function clearPendingLogo() {
    revokeObjectUrl(pendingLogoPreviewUrl);
    setPendingLogoFile(null);
    setPendingLogoPreviewUrl(null);
    setPendingLogoMetadata(null);
  }

  function clearPendingCover() {
    revokeObjectUrl(pendingCoverPreviewUrl);
    setPendingCoverFile(null);
    setPendingCoverPreviewUrl(null);
    setPendingCoverMetadata(null);
  }

  function cancelLogoSelection() {
    clearPendingLogo();
    setLogoError(null);
    setLogoStatus(null);
  }

  function cancelCoverSelection() {
    clearPendingCover();
    setCoverError(null);
    setCoverStatus(null);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="admin-settings-public-form admin-settings-landing-editor"
    >
      <input ref={logoUrlInputRef} type="hidden" name="logo_url" value={logoUrl} readOnly />
      <input
        ref={coverImageUrlInputRef}
        type="hidden"
        name="cover_image_url"
        value={coverImageUrl}
        readOnly
      />

      <div className="admin-settings-landing-editor__layout">
        <div className="admin-settings-landing-editor__form">
          <section className="admin-settings-section admin-settings-landing-section">
            <div className="admin-settings-section__header">
              <h3 className="admin-settings-section__title">Identidad</h3>
              <p className="admin-settings-section__description">
                Definí cómo se reconoce visualmente tu negocio.
              </p>
            </div>

            <div className="admin-settings-public-assets">
              <PublicAssetUpload
                inputId="logo-file"
                label="Logo del negocio"
                variant="logo"
                previewSrc={displayLogoSrc}
                state={logoUploadState}
                metadata={pendingLogoMetadata}
                hint={LOGO_HINT}
                error={logoError}
                status={logoStatus}
                disabled={isPending || isUploadingAsset}
                changeLabel={displayLogoSrc ? "Cambiar logo" : "Subir logo"}
                onFileSelected={handleLogoFileSelected}
                onCancelSelection={cancelLogoSelection}
              />

              <BrandPaletteControl
                name="primary_color"
                value={primaryColor}
                publishedValue={publishedPrimaryColor}
                disabled={isPending || isUploadingAsset}
                onChange={setPrimaryColor}
              />
            </div>
          </section>

          <section className="admin-settings-section admin-settings-landing-section">
            <div className="admin-settings-section__header">
              <h3 className="admin-settings-section__title">Imagen de portada</h3>
              <p className="admin-settings-section__description">
                Elegí una imagen horizontal que represente tu negocio.
              </p>
            </div>

            <PublicAssetUpload
              inputId="cover-file"
              label="Imagen de portada"
              variant="cover"
              previewSrc={displayCoverSrc}
              state={coverUploadState}
              metadata={pendingCoverMetadata}
              hint={COVER_HINT}
              error={coverError}
              status={coverStatus}
              disabled={isPending || isUploadingAsset}
              changeLabel={displayCoverSrc ? "Cambiar portada" : "Subir portada"}
              onFileSelected={handleCoverFileSelected}
              onCancelSelection={cancelCoverSelection}
            />
          </section>

          <section className="admin-settings-section admin-settings-landing-section">
            <div className="admin-settings-section__header">
              <h3 className="admin-settings-section__title">Presentación</h3>
              <p className="admin-settings-section__description">
                Contá brevemente qué ofrece tu negocio y dónde encontrarlo.
              </p>
            </div>

            <div className="admin-settings-public-grid">
              <label className="ui-field" htmlFor="description">
                <span className="ui-label">Descripción</span>
                <textarea
                  id="description"
                  name="description"
                  className="ui-input admin-settings-public-textarea"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={isPending}
                  placeholder="Contá brevemente qué ofrece tu negocio."
                />
                <p className="ui-helper">Este texto aparece en la landing pública de tu negocio.</p>
              </label>

              <Input
                label="Instagram del negocio"
                name="instagram_url"
                type="url"
                value={instagramUrl}
                onChange={(event) => setInstagramUrl(event.target.value)}
                disabled={isPending}
                placeholder="https://instagram.com/tu-negocio"
                helperText="Podés dejarlo vacío si no querés mostrarlo todavía."
              />
            </div>
          </section>

          {state.error ? (
            <p className="admin-feedback admin-feedback--error">{state.error}</p>
          ) : null}
          {formError ? <p className="admin-feedback admin-feedback--error">{formError}</p> : null}
          {showSavedState ? (
            <p className="admin-feedback admin-feedback--success" role="status">
              Cambios publicados correctamente.
            </p>
          ) : null}

          <div className="admin-settings-form-actions admin-settings-landing-editor__actions">
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

        <aside
          className="admin-settings-landing-editor__preview"
          aria-label="Estado y vista previa de presencia pública"
        >
          <div className="admin-settings-landing-preview-panel">
            <PublicPresenceReadiness
              identity={{
                hasLogo: Boolean(displayLogoSrc),
                hasCover: Boolean(displayCoverSrc),
                primaryColor,
                pendingLogo: hasPendingLogo,
                pendingCover: hasPendingCover,
                pendingColor: hasUnsavedColorChange
              }}
              landing={{
                description,
                instagramUrl,
                pendingDescription: hasUnsavedDescriptionChange,
                pendingInstagram: hasUnsavedInstagramChange
              }}
              catalog={{
                headline: publishedCatalog?.headline ?? null,
                badge: publishedCatalog?.badge ?? null,
                microcopy: publishedCatalog?.microcopy ?? null
              }}
              publication={{
                slug: publication?.slug ?? null,
                publicUrl: publication?.publicUrl ?? publicLandingHref
              }}
            />

            {hasPendingChanges ? (
              <div
                className="admin-settings-landing-preview-panel__pending"
                role="status"
                aria-live="polite"
              >
                <strong>Tenés cambios pendientes de publicar.</strong>
                <ul className="admin-settings-landing-preview-panel__pending-list">
                  {pendingChangeLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <PublicPresencePreview
              defaultMode="landing"
              businessName={businessName}
              logoUrl={displayLogoSrc}
              coverImageUrl={displayCoverSrc}
              primaryColor={primaryColor}
              landing={{
                description,
                instagramUrl,
                publicUrl: publicLandingHref
              }}
              catalog={{
                headline: publishedCatalog?.headline ?? null,
                badge: publishedCatalog?.badge ?? null,
                microcopy: publishedCatalog?.microcopy ?? null,
                publicUrl: publicCatalogHref
              }}
              catalogNeutralMessage={
                !publishedCatalog?.headline?.trim() &&
                !publishedCatalog?.badge?.trim() &&
                !publishedCatalog?.microcopy?.trim()
                  ? "Configurá el encabezado del catálogo desde la sección Catálogo."
                  : null
              }
            />
          </div>
        </aside>
      </div>
    </form>
  );
}

function getAssetUploadState(input: {
  hasPublishedAsset: boolean;
  hasPendingFile: boolean;
  isUploading: boolean;
}): PublicAssetUploadState {
  if (input.isUploading) {
    return "uploading";
  }

  if (input.hasPendingFile) {
    return "selected";
  }

  if (input.hasPublishedAsset) {
    return "published";
  }

  return "empty";
}

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Formato no compatible. Usá JPG, PNG o WebP.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "La imagen supera 5 MB. Elegí una imagen más liviana.";
  }

  return null;
}

async function buildFileMetadata(file: File, includeDimensions = false) {
  const parts = [file.name, formatFileSize(file.size), formatMimeLabel(file.type)];

  if (includeDimensions) {
    const dimensions = await loadImageDimensions(file);

    if (dimensions) {
      parts.push(`${dimensions.width}×${dimensions.height}`);
    }
  }

  return parts.join(" · ");
}

async function uploadBusinessAsset(
  file: File,
  businessId: string,
  folder: "logo" | "cover"
) {
  const validationError = validateImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createSupabaseBrowserClient();
  const fileExt = getFileExtension(file.name);
  const filePath = `${businessId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("business-assets")
    .upload(filePath, file, {
      contentType: file.type || undefined,
      upsert: true
    });

  if (uploadError) {
    throw new Error(uploadError.message || "No pudimos subir la imagen.");
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from("business-assets").getPublicUrl(filePath);

  return publicUrl;
}

function loadImageDimensions(file: File) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMimeLabel(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
    default:
      return mimeType.replace("image/", "").toUpperCase();
  }
}

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}
