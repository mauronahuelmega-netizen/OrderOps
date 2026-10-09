"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageCropModal from "@/components/admin/products/image-crop-modal";
import { createCategoryAction } from "@/app/admin/(protected)/categories/actions";
import {
  cleanupPendingProductImageAction,
  createProductAction
} from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import { createClientSafeId, createClientSafeUuid } from "@/lib/client/safe-random-id";
import {
  isSupportedProductImageInput,
  optimizeProductImage,
  prepareProductImageForCrop,
  ProductImageOptimizationError
} from "@/lib/products/product-image-optimization";
import { buildProductImageObjectPath } from "@/lib/products/product-image-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import toggleStyles from "./product-availability-toggle.module.css";
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

/** Visual-only required affordance; native `required` remains semantic authority. */
function RequiredMark() {
  return (
    <span className={styles.requiredMark} aria-hidden="true">*</span>
  );
}

/** Label text + mark; spacing owned by `.fieldLabelInline` column-gap (not margin/whitespace). */
function requiredFieldLabel(text: string) {
  return (
    <span className={styles.fieldLabelInline}>
      {text}
      <RequiredMark />
    </span>
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
  const pendingImageFileRef = useRef<File | null>(null);
  const cropPreviewRevokeRef = useRef<(() => void) | null>(null);
  const draftProductIdRef = useRef(createClientSafeUuid());
  const [state, dispatchFormAction, isPending] = useActionState(
    createProductFormAction as (
      prevState: ActionState,
      formData: FormData
    ) => Promise<ActionState>,
    initialState
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [trackStock, setTrackStock] = useState(true);
  const [stockValue, setStockValue] = useState(0);

  async function createProductFormAction(prevState: ActionState, formData: FormData) {
    const productId = draftProductIdRef.current;
    formData.set("product_id", productId);

    let uploadedPath: string | null = null;

    try {
      if (pendingImageFileRef.current) {
        setIsUploadingImage(true);
        setImageError(null);

        const file = pendingImageFileRef.current;
        const fileExt = getFileExtension(file.name);
        const fileName = `${createClientSafeId("product-image")}.${fileExt}`;
        const filePath = buildProductImageObjectPath({
          businessId,
          productId,
          fileName
        });

        const supabase = createSupabaseBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            contentType: file.type || undefined,
            upsert: false
          });

        if (uploadError) {
          return {
            error: uploadError.message || "No pudimos subir la imagen."
          };
        }

        uploadedPath = filePath;
        formData.set("image_intent", "replace");
        formData.set("image_path", filePath);
      } else {
        formData.set("image_intent", "none");
        formData.delete("image_path");
      }

      const result = await createProductAction(prevState, formData);

      if (!result.success && uploadedPath) {
        await cleanupPendingProductImageAction(uploadedPath);
      }

      return result;
    } finally {
      setIsUploadingImage(false);
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      cropPreviewRevokeRef.current?.();
      cropPreviewRevokeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setImageError(null);
      pendingImageFileRef.current = null;
      draftProductIdRef.current = createClientSafeUuid();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setSelectedCategoryId("");
      setNewCategoryName("");
      setIsValid(false);
      setPendingImageSrc(null);
      cropPreviewRevokeRef.current?.();
      cropPreviewRevokeRef.current = null;
      setTrackStock(true);
      setStockValue(0);
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

  function clearCropPreview() {
    cropPreviewRevokeRef.current?.();
    cropPreviewRevokeRef.current = null;
    setPendingImageSrc(null);
  }

  async function queueImageForCrop(file: File) {
    if (!isSupportedProductImageInput(file)) {
      setImageError("Seleccioná un archivo de imagen válido.");
      return;
    }

    setImageError(null);
    setIsProcessingImage(true);

    try {
      clearCropPreview();
      const prepared = await prepareProductImageForCrop(file);
      if (prepared.revoke) {
        cropPreviewRevokeRef.current = prepared.revoke;
      }
      setPendingImageSrc(prepared.previewSrc);
    } catch (error) {
      const message =
        error instanceof ProductImageOptimizationError
          ? error.message
          : "No pudimos procesar la imagen. Probá con otra foto.";
      setImageError(message);
    } finally {
      setIsProcessingImage(false);
    }
  }

  async function handleCroppedImage(croppedFile: File) {
    clearCropPreview();
    setIsProcessingImage(true);
    setImageError(null);

    try {
      const optimized = await optimizeProductImage(croppedFile);
      setLocalPreview(optimized);
      pendingImageFileRef.current = optimized;
    } catch (error) {
      pendingImageFileRef.current = null;
      clearPreviewUrl();
      const message =
        error instanceof ProductImageOptimizationError
          ? error.message
          : "No pudimos procesar la imagen. Probá con otra foto.";
      setImageError(message);
    } finally {
      setIsProcessingImage(false);
    }
  }

  function handleCancelCrop() {
    clearCropPreview();
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      pendingImageFileRef.current = null;
      setImageError(null);
      clearPreviewUrl();
      return;
    }

    await queueImageForCrop(file);
    event.target.value = "";
  }

  function handleImageDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function handleImageDragEnter(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  async function handleImageDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (isPending || isUploadingImage || isProcessingImage || pendingImageSrc) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await queueImageForCrop(file);
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

  const dropzoneImageSrc = previewUrl;

  function handleRecropClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!dropzoneImageSrc || isPending || isUploadingImage || isProcessingImage || pendingImageSrc) {
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
        action={dispatchFormAction}
        onChange={(event) => setIsValid(event.currentTarget.checkValidity())}
        className={
          embedded
            ? `admin-embedded-form ${styles.formShell} ${styles.shell} ${styles.createForm}`
            : `admin-form-card ${styles.formShell} ${styles.createForm}`
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
              className={`${styles.imageDropzone} ${dropzoneImageSrc ? styles.imageDropzoneHasImage : ""} ${isUploadingImage || isProcessingImage ? styles.imageDropzoneBusy : ""}`}
              aria-label="Agregar imagen de producto"
              onDragOver={handleImageDragOver}
              onDragEnter={handleImageDragEnter}
              onDrop={(event) => {
                void handleImageDrop(event);
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                className="sr-only"
                disabled={isPending || isUploadingImage || isProcessingImage || Boolean(pendingImageSrc)}
                onChange={(event) => {
                  void handleImageChange(event);
                }}
              />
              {dropzoneImageSrc ? (
                <>
                  <img src={dropzoneImageSrc} alt="Vista previa del producto" />
                  <button
                    type="button"
                    className={styles.editImageBadge}
                    title="Haga clic para recortar"
                    aria-label="Haga clic para recortar"
                    disabled={isPending || isUploadingImage || isProcessingImage || Boolean(pendingImageSrc)}
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
                  <span className={`${styles.imageDropzoneText} ${styles.imageDropzoneTextDesktop}`}>
                    Arrastrá tu imagen o hacé clic
                  </span>
                  <span className={`${styles.imageDropzoneText} ${styles.imageDropzoneTextMobile}`}>
                    <span className={styles.imageDropzonePrimary}>Agregar imagen</span>
                    <span className={styles.imageDropzoneFormats}>JPG, PNG o HEIC</span>
                  </span>
                </>
              )}
            </label>
            {isProcessingImage ? (
              <span className={styles.imageHint}>Optimizando imagen…</span>
            ) : isUploadingImage ? (
              <span className={styles.imageHint}>Subiendo imagen...</span>
            ) : null}
          </div>

          <p className={styles.requiredLegend}>
            <span aria-hidden="true">*</span> Campos obligatorios
          </p>

          <div className={styles.grid2}>
            <Input
              name="name"
              type="text"
              label={requiredFieldLabel("Nombre")}
              disabled={isPending}
              required
            />

            <div className={`admin-field ${styles.field}`}>
              <label className="ui-label" htmlFor="create-product-category">
                {requiredFieldLabel("Categoría")}
              </label>
              <div className={styles.categoryWrapper}>
                <select
                  id="create-product-category"
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
                {requiredFieldLabel("Precio")}
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
              id="create-product-stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              label={requiredFieldLabel("Stock inicial")}
              value={String(stockValue)}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setStockValue(Number.isFinite(next) ? next : 0);
              }}
              disabled={isPending}
              required
              aria-describedby={
                trackStock && stockValue <= 0 ? "create-stock-zero-info" : undefined
              }
            />
          </div>

          <div className={`${styles.toggleStack} ${styles.createStockBlock}`}>
            <div className={styles.toggleStackHeader}>
              <span className={styles.toggleLabel} id="create-track-stock-label">
                Controlar stock automáticamente
              </span>
              <div className={`${toggleStyles.toggleHost} ${styles.createToggleHost}`}>
                <label className={toggleStyles.switch}>
                  <input
                    name="track_stock"
                    type="checkbox"
                    checked={trackStock}
                    onChange={(event) => setTrackStock(event.target.checked)}
                    disabled={isPending}
                    aria-labelledby="create-track-stock-label"
                    aria-describedby="create-track-stock-helper"
                  />
                  <span className={toggleStyles.slider} />
                </label>
              </div>
            </div>
            <p id="create-track-stock-helper" className={styles.toggleHelper}>
              Descontamos el stock con cada pedido. Al llegar a 0, el producto deja de estar
              disponible.
            </p>
            {trackStock && stockValue <= 0 ? (
              <p id="create-stock-zero-info" className={styles.toggleInfo}>
                Con stock 0, el producto se creará como no disponible.
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.feedback}>
          {imageError ? <p className="admin-feedback admin-feedback--error">{imageError}</p> : null}
          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {state.success ? (
            <p className="admin-feedback admin-feedback--success">Producto creado.</p>
          ) : null}
        </div>

        <div
          className={`${styles.actions} ${embedded ? styles.actionsSticky : ""} ${styles.createActions}`}
        >
          <Button
            type="submit"
            className="admin-primary-button"
            disabled={!isValid || isPending || isUploadingImage || isProcessingImage || isSavingCategory}
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
