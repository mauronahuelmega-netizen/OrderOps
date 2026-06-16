"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageCropModal from "@/components/admin/products/image-crop-modal";
import { createCategoryAction } from "@/app/admin/(protected)/categories/actions";
import { createProductAction } from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./product-form.module.css";

type CreateProductFormProps = {
  businessId: string;
  categories: AdminCategory[];
  embedded?: boolean;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M8.12 15.88 12 12" />
      <path d="m12 12 9-5" />
      <path d="m12 12 9 5" />
    </svg>
  );
}

export default function CreateProductForm({
  businessId,
  categories,
  embedded = false
}: CreateProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const categoryDialogRef = useRef<HTMLDialogElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setImageUrl("");
      setImageError(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setSelectedCategoryId("");
      setNewCategoryName("");
      setIsValid(false);
      setPendingImageSrc(null);
      router.refresh();
    }
  }, [router, state.success]);

  useEffect(() => {
    if (formRef.current) {
      setIsValid(formRef.current.checkValidity());
    }
  }, [selectedCategoryId, categories.length]);

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  function setLocalPreview(file: File) {
    clearPreviewUrl();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  function queueImageForCrop(file: File) {
    if (!file.type.startsWith("image/")) {
      setImageError("Seleccioná un archivo de imagen válido.");
      return;
    }

    setImageError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPendingImageSrc(reader.result);
      }
    };
    reader.onerror = () => {
      setImageError("No pudimos leer la imagen seleccionada.");
    };
    reader.readAsDataURL(file);
  }

  async function handleCroppedImage(croppedFile: File) {
    setPendingImageSrc(null);
    await processImageFile(croppedFile);
  }

  function handleCancelCrop() {
    setPendingImageSrc(null);
  }

  async function processImageFile(file: File) {
    setLocalPreview(file);
    setIsUploadingImage(true);
    setImageError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const productId = crypto.randomUUID();
      const fileExt = getFileExtension(file.name);
      const filePath = `${businessId}/${productId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          contentType: file.type || undefined,
          upsert: true
        });

      if (uploadError) {
        setImageUrl("");
        setImageError(uploadError.message || "No pudimos subir la imagen.");
        clearPreviewUrl();
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageUrl("");
      setImageError(null);
      clearPreviewUrl();
      return;
    }

    queueImageForCrop(file);
    event.target.value = "";
  }

  function handleImageDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function handleImageDragEnter(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function handleImageDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (isPending || isUploadingImage || pendingImageSrc) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      queueImageForCrop(file);
    }
  }

  async function handleSaveCategory() {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setCategoryError("Ingresá un nombre para la categoría.");
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    const formData = new FormData();
    formData.set("name", trimmedName);
    const result = await createCategoryAction({}, formData);

    setIsSavingCategory(false);

    if (result.error) {
      setCategoryError(result.error);
      return;
    }

    if (result.categoryId) {
      setSelectedCategoryId(result.categoryId);
    }

    setNewCategoryName("");
    categoryDialogRef.current?.close();
    router.refresh();

    requestAnimationFrame(() => {
      if (formRef.current) {
        setIsValid(formRef.current.checkValidity());
      }
    });
  }

  function handleCloseCategoryDialog() {
    setNewCategoryName("");
    setCategoryError(null);
    categoryDialogRef.current?.close();
  }

  const dropzoneImageSrc = previewUrl ?? (imageUrl || null);

  function handleRecropClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!dropzoneImageSrc || isPending || isUploadingImage || pendingImageSrc) {
      return;
    }

    setImageError(null);
    setPendingImageSrc(dropzoneImageSrc);
  }

  return (
    <>
      {pendingImageSrc ? (
        <ImageCropModal
          imageSrc={pendingImageSrc}
          onCropComplete={(croppedFile) => {
            void handleCroppedImage(croppedFile);
          }}
          onCancel={handleCancelCrop}
        />
      ) : null}

      <form
        ref={formRef}
        action={formAction}
        onChange={(event) => setIsValid(event.currentTarget.checkValidity())}
        className={
          embedded
            ? `admin-embedded-form ${styles.formShell} ${styles.shell}`
            : `admin-form-card ${styles.formShell}`
        }
      >
        {!embedded ? (
          <div className="admin-form-header">
            <h2>Nuevo producto</h2>
            <p>Creá un producto simple con categoría, precio e imagen opcional.</p>
          </div>
        ) : null}

        <div className={styles.formSection}>
          <div className={styles.imageUploadSection}>
            <span className="sr-only">Imagen</span>
            <label
              className={`${styles.imageDropzone} ${dropzoneImageSrc ? styles.imageDropzoneHasImage : ""} ${isUploadingImage ? styles.imageDropzoneBusy : ""}`}
              onDragOver={handleImageDragOver}
              onDragEnter={handleImageDragEnter}
              onDrop={handleImageDrop}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isPending || isUploadingImage || Boolean(pendingImageSrc)}
                onChange={handleImageChange}
              />
              {dropzoneImageSrc ? (
                <>
                  <img src={dropzoneImageSrc} alt="Vista previa del producto" />
                  <button
                    type="button"
                    className={styles.editImageBadge}
                    title="Haga clic para recortar"
                    aria-label="Haga clic para recortar"
                    disabled={isPending || isUploadingImage || Boolean(pendingImageSrc)}
                    onClick={handleRecropClick}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <ScissorsIcon />
                  </button>
                </>
              ) : (
                <>
                  <PlusIcon />
                  <span className={styles.imageDropzoneText}>Arrastrá tu imagen o hacé clic</span>
                </>
              )}
            </label>
            {isUploadingImage ? <span className={styles.imageHint}>Subiendo imagen...</span> : null}
          </div>

          <div className={styles.grid2}>
            <Input name="name" type="text" label="Nombre" disabled={isPending} required />

            <div className={`admin-field ${styles.field}`}>
              <span>Categoría</span>
              <div className={styles.categoryWrapper}>
                <select
                  name="category_id"
                  className={styles.select}
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  disabled={isPending}
                  required
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Crear nueva categoría"
                  title="Crear nueva categoría"
                  onClick={() => categoryDialogRef.current?.showModal()}
                  disabled={isPending || isSavingCategory}
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          </div>

          <label className={`ui-field ${styles.field}`}>
            <span className="ui-label">Descripción</span>
            <textarea
              className={`ui-input ${styles.textarea}`}
              name="description"
              rows={3}
              disabled={isPending}
            />
          </label>
        </div>

        <hr className={styles.divider} />

        <div className={styles.formSection}>
          <div className={styles.grid3}>
            <div className={`ui-field ${styles.field}`}>
              <label className="ui-label" htmlFor="create-product-price">
                Precio
              </label>
              <div className={styles.currencyInputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  id="create-product-price"
                  name="price"
                  type="number"
                  className="ui-input"
                  min="0"
                  step="0.01"
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <div className={`ui-field ${styles.field}`}>
              <div className={styles.labelRow}>
                <label className="ui-label" htmlFor="create-product-sku">
                  SKU
                </label>
                <span className={styles.tooltipWrapper}>
                  <svg
                    className={styles.infoIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 10v6" />
                    <path d="M12 7h.01" />
                  </svg>
                  <span className={styles.tooltipText}>
                    Se autogenerará (ej: HAM-001) si se deja en blanco
                  </span>
                </span>
              </div>
              <input
                id="create-product-sku"
                name="sku"
                type="text"
                className="ui-input"
                disabled={isPending}
              />
            </div>

            <Input
              name="stock"
              type="number"
              min="0"
              step="1"
              label="Stock"
              defaultValue="0"
              disabled={isPending}
              required
            />
          </div>
        </div>

        <input type="hidden" name="image_url" value={imageUrl} />

        <div className={styles.feedback}>
          {imageError ? <p className="admin-feedback admin-feedback--error">{imageError}</p> : null}
          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {state.success ? (
            <p className="admin-feedback admin-feedback--success">Producto creado.</p>
          ) : null}
        </div>

        <div className={`${styles.actions} ${embedded ? styles.actionsSticky : ""}`}>
          <Button
            type="submit"
            className="admin-primary-button"
            disabled={!isValid || isPending || isUploadingImage || isSavingCategory}
            variant="primary"
          >
            {isPending ? "Guardando..." : "Guardar producto"}
          </Button>
        </div>
      </form>

      <dialog ref={categoryDialogRef} className={styles.categoryDialog}>
        <form
          method="dialog"
          className={styles.categoryDialogForm}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveCategory();
          }}
        >
          <h3 className={styles.categoryDialogTitle}>Nueva categoría</h3>
          <label className={`admin-field ${styles.field}`}>
            <span>Nombre</span>
            <input
              type="text"
              className="ui-input"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              disabled={isSavingCategory}
              required
            />
          </label>
          {categoryError ? (
            <p className="admin-feedback admin-feedback--error">{categoryError}</p>
          ) : null}
          <div className={styles.categoryDialogActions}>
            <button
              type="button"
              className={styles.categoryDialogCancel}
              onClick={handleCloseCategoryDialog}
              disabled={isSavingCategory}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.categoryDialogSave} disabled={isSavingCategory}>
              {isSavingCategory ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}
