"use client";

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
    if (state.success) {
      setFormError(null);
      setLogoStatus((current) => current ?? (logoUrl ? "Logo guardado." : null));
      setCoverStatus((current) => current ?? (coverImageUrl ? "Portada guardada." : null));
      router.refresh();
    }
  }, [coverImageUrl, logoUrl, router, state.success]);

  const isUploadingAsset = isUploadingLogo || isUploadingCover;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="admin-settings-public-form"
      onSubmit={(event) => {
        if (isUploadingAsset) {
          event.preventDefault();
          setFormError("Esperá a que termine la subida.");
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
          setFormError("El logo todavía no quedó listo para guardarse. Probá de nuevo en un segundo.");
          return;
        }

        if (coverImageUrl && submittedCoverImageUrl !== coverImageUrl) {
          event.preventDefault();
          setFormError(
            "La portada todavía no quedó lista para guardarse. Probá de nuevo en un segundo."
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

      <div className="admin-settings-public-assets">
        <label className="admin-field">
          <span>Logo</span>
          <div className="admin-settings-public-preview admin-settings-public-preview--logo">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo actual del negocio" />
            ) : (
              <div className="admin-settings-public-empty">Sin logo</div>
            )}
          </div>
          <input
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
          <p className="ui-helper">Subi una imagen JPG, PNG o WebP.</p>
          {!logoError && logoStatus ? (
            <p className="admin-feedback admin-feedback--success">{logoStatus}</p>
          ) : null}
          {logoError ? <p className="admin-feedback admin-feedback--error">{logoError}</p> : null}
        </label>

        <label className="admin-field">
          <span>Portada</span>
          <div className="admin-settings-public-preview admin-settings-public-preview--cover">
            {coverImageUrl ? (
              <img src={coverImageUrl} alt="Portada actual del negocio" />
            ) : (
              <div className="admin-settings-public-empty">Sin portada</div>
            )}
          </div>
          <input
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
          <p className="ui-helper">
            Mas adelante podras subir imagenes directamente con mas opciones.
          </p>
          {!coverError && coverStatus ? (
            <p className="admin-feedback admin-feedback--success">{coverStatus}</p>
          ) : null}
          {coverError ? <p className="admin-feedback admin-feedback--error">{coverError}</p> : null}
        </label>
      </div>

      <div className="admin-settings-public-grid">
        <label className="ui-field" htmlFor="description">
          <span className="ui-label">Descripcion publica</span>
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
          <p className="ui-helper">
            Este texto se mostrara en la landing publica del negocio.
          </p>
        </label>

        <Input
          label="Color principal"
          name="primary_color"
          type="text"
          value={primaryColor}
          onChange={(event) => setPrimaryColor(event.target.value)}
          disabled={isPending}
          placeholder="#2563EB"
          helperText="Usa un color hexadecimal en formato #RRGGBB."
        />

        <Input
          label="Instagram"
          name="instagram_url"
          type="url"
          value={instagramUrl}
          onChange={(event) => setInstagramUrl(event.target.value)}
          disabled={isPending}
          placeholder="https://instagram.com/tu-negocio"
          helperText="Podes dejarlo vacio si no queres mostrarlo todavia."
        />
      </div>

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
