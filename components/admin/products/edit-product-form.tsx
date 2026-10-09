"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import ImageCropModal from "@/components/admin/products/image-crop-modal";
import ProductCustomizationOverridesPanel from "@/components/admin/product-customization/product-customization-overrides-panel";
import type { CustomizationBaselineReport } from "@/components/admin/product-customization/product-customization-overrides-panel";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import {
  archiveProductAction,
  cleanupPendingProductImageAction,
  deleteProductPermanentlyAction,
  restoreProductAction,
  saveProductEditDraftAction
} from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import { isProductArchived, type AdminProduct } from "@/lib/products/admin-product-types";
import { createClientSafeId } from "@/lib/client/safe-random-id";
import {
  type CustomizationLoadState,
  type EditImageIntent,
  type UnifiedEditDraftSnapshot,
  canonicalizeIdSet,
  parseEditPriceInput,
  toggleIdInCanonicalSet,
  unifiedEditDraftEqual
} from "@/lib/products/edit-unified-draft";
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

type EditProductFormProps = {
  businessId: string;
  categories: AdminCategory[];
  product: AdminProduct;
  inModal?: boolean;
  onSuccess?: () => void;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

type DiscardIntent = "close" | "archive" | "delete";
type LifecycleConfirmKind = "archive" | "delete";

const initialState: ActionState = {};

function buildProductBaselineSnapshot(product: AdminProduct): UnifiedEditDraftSnapshot {
  return {
    name: product.name,
    description: product.description ?? "",
    price: Number(product.price),
    sku: product.sku ?? "",
    stock: product.stock ?? 0,
    isAvailable: product.is_available,
    trackStock: product.track_stock,
    imageIntent: "keep",
    hiddenGroupIds: [],
    hiddenOptionIds: []
  };
}

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

/** Label text + mark; spacing owned by `.fieldLabelInline` column-gap. */
function requiredFieldLabel(text: string) {
  return (
    <span className={styles.fieldLabelInline}>
      {text}
      <RequiredMark />
    </span>
  );
}

export default function EditProductForm({
  businessId,
  categories,
  product,
  inModal = false,
  onSuccess
}: EditProductFormProps) {
  const router = useRouter();
  const { closeFlyout, registerFlyoutCloseHandler } = useProductsManagement();
  const { pushToast } = useAdminToast();
  const formRef = useRef<HTMLFormElement>(null);
  const discardDialogRef = useRef<HTMLDialogElement>(null);
  const archiveDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const stayEditingButtonRef = useRef<HTMLButtonElement>(null);
  const archiveCancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const archiveTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerRef = useRef<HTMLButtonElement>(null);
  const pendingCommitCloseRef = useRef<(() => void) | null>(null);
  const discardIntentRef = useRef<DiscardIntent>("close");
  const previewUrlRef = useRef<string | null>(null);
  const pendingImageFileRef = useRef<File | null>(null);
  const cropPreviewRevokeRef = useRef<(() => void) | null>(null);
  const imageIntentRef = useRef<EditImageIntent>("keep");
  const isDirtyRef = useRef(false);
  const customizationReadyRef = useRef(false);
  const [state, dispatchFormAction, isPending] = useActionState(
    editProductFormAction as (
      prevState: ActionState,
      formData: FormData
    ) => Promise<ActionState>,
    initialState
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageIntent, setImageIntent] = useState<EditImageIntent>("keep");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(product.is_available);
  const [trackStock, setTrackStock] = useState(product.track_stock);
  const [stockValue, setStockValue] = useState(product.stock ?? 0);
  const [nameValue, setNameValue] = useState(product.name);
  const [descriptionValue, setDescriptionValue] = useState(product.description ?? "");
  const [priceValue, setPriceValue] = useState(String(product.price));
  const [skuValue, setSkuValue] = useState(product.sku ?? "");
  const [isValid, setIsValid] = useState(true);
  const [persistedBaseline, setPersistedBaseline] = useState<UnifiedEditDraftSnapshot>(() =>
    buildProductBaselineSnapshot(product)
  );
  const [hiddenGroupIds, setHiddenGroupIds] = useState<string[]>([]);
  const [hiddenOptionIds, setHiddenOptionIds] = useState<string[]>([]);
  const [customizationLoadState, setCustomizationLoadState] =
    useState<CustomizationLoadState>("loading");
  const [customizationLoadError, setCustomizationLoadError] = useState<string | null>(null);
  const [lifecyclePending, setLifecyclePending] = useState(false);

  const isArchived = isProductArchived(product);
  const fieldsLocked = isPending || isArchived || lifecyclePending;

  const categoryName =
    product.categories?.name ??
    categories.find((category) => category.id === product.category_id)?.name ??
    "Sin categoría";

  const customizationReady =
    customizationLoadState === "ready" || customizationLoadState === "empty";
  customizationReadyRef.current = customizationReady;

  async function editProductFormAction(prevState: ActionState, formData: FormData) {
    const intent = imageIntentRef.current;
    formData.set("image_intent", intent);

    let uploadedPath: string | null = null;

    try {
      if (intent === "replace") {
        if (!pendingImageFileRef.current) {
          return { error: "Seleccioná una imagen para reemplazar." };
        }

        setIsUploadingImage(true);
        setImageError(null);

        const file = pendingImageFileRef.current;
        const fileExt = getFileExtension(file.name);
        const fileName = `${createClientSafeId("product-image")}.${fileExt}`;
        const filePath = buildProductImageObjectPath({
          businessId,
          productId: product.id,
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
        formData.set("image_path", filePath);
      } else {
        formData.delete("image_path");
      }

      const result = await saveProductEditDraftAction(prevState, formData);

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
      router.refresh();
      onSuccess?.();
    }
  }, [onSuccess, router, state.success]);

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  function clearCropPreview() {
    cropPreviewRevokeRef.current?.();
    cropPreviewRevokeRef.current = null;
    setPendingImageSrc(null);
  }

  useEffect(() => {
    setPersistedBaseline(buildProductBaselineSnapshot(product));
    setNameValue(product.name);
    setDescriptionValue(product.description ?? "");
    setPriceValue(String(product.price));
    setSkuValue(product.sku ?? "");
    setIsAvailable(product.is_available);
    setTrackStock(product.track_stock);
    setStockValue(product.stock ?? 0);
    setHiddenGroupIds([]);
    setHiddenOptionIds([]);
    setCustomizationLoadState("loading");
    setCustomizationLoadError(null);
    pendingImageFileRef.current = null;
    imageIntentRef.current = "keep";
    setImageIntent("keep");
    setImageError(null);
    clearCropPreview();
    setIsProcessingImage(false);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, [
    product.id,
    product.name,
    product.description,
    product.price,
    product.sku,
    product.is_available,
    product.track_stock,
    product.stock,
    product.category_id,
    product.image_url
  ]);

  function setLocalPreview(file: File) {
    clearPreviewUrl();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  function setImageIntentState(next: EditImageIntent) {
    imageIntentRef.current = next;
    setImageIntent(next);
  }

  function handleCustomizationLoading(productId: string) {
    if (productId !== product.id) {
      return;
    }
    setCustomizationLoadState("loading");
    setCustomizationLoadError(null);
  }

  function handleCustomizationBaseline(report: CustomizationBaselineReport) {
    if (report.productId !== product.id) {
      return;
    }
    const nextHiddenGroupIds = canonicalizeIdSet(report.hiddenGroupIds);
    const nextHiddenOptionIds = canonicalizeIdSet(report.hiddenOptionIds);
    setHiddenGroupIds(nextHiddenGroupIds);
    setHiddenOptionIds(nextHiddenOptionIds);
    setPersistedBaseline((prev) => ({
      ...prev,
      hiddenGroupIds: nextHiddenGroupIds,
      hiddenOptionIds: nextHiddenOptionIds
    }));
    setCustomizationLoadState(report.loadState);
    setCustomizationLoadError(null);
  }

  function handleCustomizationLoadError(productId: string, error: string) {
    if (productId !== product.id) {
      return;
    }
    setCustomizationLoadState("error");
    setCustomizationLoadError(error);
  }

  function handleToggleGroupHidden(groupId: string) {
    setHiddenGroupIds((prev) => toggleIdInCanonicalSet(prev, groupId));
  }

  function handleToggleOptionHidden(optionId: string) {
    setHiddenOptionIds((prev) => toggleIdInCanonicalSet(prev, optionId));
  }

  const parsedPrice = parseEditPriceInput(priceValue);
  const currentSnapshot: UnifiedEditDraftSnapshot = useMemo(
    () => ({
      name: nameValue,
      description: descriptionValue,
      price: parsedPrice ?? Number.NaN,
      sku: skuValue,
      stock: stockValue,
      isAvailable,
      trackStock,
      imageIntent,
      hiddenGroupIds,
      hiddenOptionIds
    }),
    [
      nameValue,
      descriptionValue,
      parsedPrice,
      skuValue,
      stockValue,
      isAvailable,
      trackStock,
      imageIntent,
      hiddenGroupIds,
      hiddenOptionIds
    ]
  );

  const isDirty = !unifiedEditDraftEqual(currentSnapshot, persistedBaseline);
  isDirtyRef.current = isDirty;

  const canSave =
    customizationReady &&
    isDirty &&
    isValid &&
    !isPending &&
    !isUploadingImage &&
    !isProcessingImage;

  useEffect(() => {
    if (!inModal) {
      registerFlyoutCloseHandler(null);
      return undefined;
    }

    registerFlyoutCloseHandler((commitClose) => {
      if (!isDirtyRef.current) {
        commitClose();
        return;
      }
      discardIntentRef.current = "close";
      pendingCommitCloseRef.current = commitClose;
      const dialog = discardDialogRef.current;
      if (!dialog) {
        return;
      }
      if (!dialog.open) {
        dialog.showModal();
      }
      requestAnimationFrame(() => {
        stayEditingButtonRef.current?.focus();
      });
    });

    return () => {
      registerFlyoutCloseHandler(null);
    };
  }, [inModal, registerFlyoutCloseHandler]);

  useEffect(() => {
    if (formRef.current) {
      setIsValid(formRef.current.checkValidity());
    }
  }, [
    nameValue,
    descriptionValue,
    priceValue,
    skuValue,
    stockValue,
    isAvailable,
    trackStock,
    imageIntent,
    product.id
  ]);

  function resetDraftToPersistedBaseline() {
    const baseline = persistedBaseline;
    setNameValue(baseline.name);
    setDescriptionValue(baseline.description);
    setPriceValue(Number.isFinite(baseline.price) ? String(baseline.price) : "");
    setSkuValue(baseline.sku);
    setStockValue(baseline.stock);
    setIsAvailable(baseline.isAvailable);
    setTrackStock(baseline.trackStock);
    setHiddenGroupIds([...baseline.hiddenGroupIds]);
    setHiddenOptionIds([...baseline.hiddenOptionIds]);
    pendingImageFileRef.current = null;
    setImageIntentState("keep");
    clearPreviewUrl();
    clearCropPreview();
    setImageError(null);
    setIsProcessingImage(false);
  }

  function openLifecycleConfirm(kind: LifecycleConfirmKind) {
    const dialog = kind === "archive" ? archiveDialogRef.current : deleteDialogRef.current;
    const focusTarget =
      kind === "archive" ? archiveCancelButtonRef.current : deleteCancelButtonRef.current;
    if (!dialog) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    requestAnimationFrame(() => {
      focusTarget?.focus();
    });
  }

  function requestLifecycleAction(kind: LifecycleConfirmKind) {
    if (lifecyclePending || isPending) {
      return;
    }

    if (isDirtyRef.current) {
      discardIntentRef.current = kind;
      pendingCommitCloseRef.current = null;
      const dialog = discardDialogRef.current;
      if (!dialog) {
        return;
      }
      if (!dialog.open) {
        dialog.showModal();
      }
      requestAnimationFrame(() => {
        stayEditingButtonRef.current?.focus();
      });
      return;
    }

    openLifecycleConfirm(kind);
  }

  function handleStayEditing() {
    discardIntentRef.current = "close";
    pendingCommitCloseRef.current = null;
    discardDialogRef.current?.close();
  }

  function handleConfirmDiscard() {
    const intent = discardIntentRef.current;
    const commitClose = pendingCommitCloseRef.current;
    pendingCommitCloseRef.current = null;
    discardIntentRef.current = "close";
    discardDialogRef.current?.close();

    if (intent === "close") {
      commitClose?.();
      return;
    }

    resetDraftToPersistedBaseline();
    requestAnimationFrame(() => {
      openLifecycleConfirm(intent);
    });
  }

  function handleDiscardDialogClose() {
    pendingCommitCloseRef.current = null;
    discardIntentRef.current = "close";
  }

  function handleArchiveDialogClose() {
    if (!lifecyclePending) {
      archiveTriggerRef.current?.focus();
    }
  }

  function handleDeleteDialogClose() {
    if (!lifecyclePending) {
      deleteTriggerRef.current?.focus();
    }
  }

  function handleCancelArchiveConfirm() {
    archiveDialogRef.current?.close();
    archiveTriggerRef.current?.focus();
  }

  function handleCancelDeleteConfirm() {
    deleteDialogRef.current?.close();
    deleteTriggerRef.current?.focus();
  }

  async function runArchiveProduct() {
    if (lifecyclePending) {
      return;
    }
    setLifecyclePending(true);
    try {
      const result = await archiveProductAction(product.id);
      if (result.error) {
        pushToast({ message: result.error, tone: "error" });
        return;
      }
      archiveDialogRef.current?.close();
      pushToast({ message: "Producto archivado.", tone: "success" });
      closeFlyout();
      router.refresh();
    } finally {
      setLifecyclePending(false);
    }
  }

  async function runDeleteProduct() {
    if (lifecyclePending) {
      return;
    }
    setLifecyclePending(true);
    try {
      const result = await deleteProductPermanentlyAction(product.id);
      if (result.error) {
        pushToast({ message: result.error, tone: "error" });
        return;
      }
      deleteDialogRef.current?.close();
      if (result.warning) {
        pushToast({ message: result.warning, tone: "info" });
      } else {
        pushToast({ message: "Producto eliminado.", tone: "success" });
      }
      closeFlyout();
      router.refresh();
    } finally {
      setLifecyclePending(false);
    }
  }

  async function runRestoreProduct() {
    if (lifecyclePending) {
      return;
    }
    setLifecyclePending(true);
    try {
      const result = await restoreProductAction(product.id);
      if (result.error) {
        pushToast({ message: result.error, tone: "error" });
        return;
      }
      pushToast({
        message: "Producto restaurado. Sigue no disponible hasta que decidas publicarlo.",
        tone: "success"
      });
      closeFlyout();
      router.refresh();
    } finally {
      setLifecyclePending(false);
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isArchived) {
      event.preventDefault();
      return;
    }
    if (!isDirtyRef.current || !customizationReadyRef.current) {
      event.preventDefault();
      return;
    }
    const form = event.currentTarget;
    const valid = form.checkValidity();
    setIsValid(valid);
    if (!valid) {
      event.preventDefault();
    }
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
      setImageIntentState("replace");
    } catch (error) {
      // Keep current persisted image / prior staged replace — do not introduce REMOVE.
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

  function handleRemoveImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isPending || isUploadingImage || isProcessingImage || pendingImageSrc) {
      return;
    }

    pendingImageFileRef.current = null;
    setImageIntentState("remove");
    clearPreviewUrl();
    setImageError(null);
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
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

  const dropzoneImageSrc =
    imageIntent === "remove" ? null : previewUrl ?? product.image_url ?? null;
  const canRemoveImage = Boolean(dropzoneImageSrc);

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
      {pendingImageSrc && !isArchived ? (
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
        onSubmit={handleFormSubmit}
        onChange={(event) => setIsValid(event.currentTarget.checkValidity())}
        className={
          inModal
            ? `${styles.formRoot} ${styles.formShell} ${styles.shell} ${styles.editForm}`
            : `${styles.standaloneCard} ${styles.formShell} ${styles.editForm}`
        }
      >
        <input type="hidden" name="product_id" value={product.id} />
        {hiddenGroupIds.map((groupId) => (
          <input key={`hidden-group-${groupId}`} type="hidden" name="hidden_group_ids" value={groupId} />
        ))}
        {hiddenOptionIds.map((optionId) => (
          <input key={`hidden-option-${optionId}`} type="hidden" name="hidden_option_ids" value={optionId} />
        ))}

        {!inModal ? (
          <div className={styles.formHeader}>
            <h2>{product.name}</h2>
          </div>
        ) : null}

        {isArchived ? (
          <div className={styles.archivedBanner} role="status">
            <strong className={styles.archivedBannerTitle}>Producto archivado</strong>
            <p className={styles.archivedBannerCopy}>
              Está fuera del catálogo y no puede editarse hasta que lo restaures.
            </p>
          </div>
        ) : null}

        <div className={styles.formSection}>
          <div className={styles.imageUploadSection}>
            <span className="sr-only">Imagen</span>
            {isArchived ? (
              <div
                className={`${styles.imageDropzone} ${
                  dropzoneImageSrc ? styles.imageDropzoneHasImage : ""
                } ${styles.imageDropzoneReadOnly}`}
                aria-label="Imagen de producto"
              >
                {dropzoneImageSrc ? (
                  <img src={dropzoneImageSrc} alt={product.name} />
                ) : (
                  <span className={styles.imageDropzoneText}>Sin imagen</span>
                )}
              </div>
            ) : (
              <>
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
                      <img src={dropzoneImageSrc} alt={product.name} />
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
                {canRemoveImage ? (
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    disabled={isPending || isUploadingImage || isProcessingImage || Boolean(pendingImageSrc)}
                    onClick={handleRemoveImage}
                  >
                    Quitar imagen
                  </button>
                ) : null}
                {isProcessingImage ? (
                  <span className={styles.imageHint}>Optimizando imagen…</span>
                ) : isUploadingImage ? (
                  <span className={styles.imageHint}>Subiendo imagen...</span>
                ) : null}
              </>
            )}
          </div>

          <p className={styles.requiredLegend}>
            <span aria-hidden="true">*</span> Campos obligatorios
          </p>

          <div className={styles.grid2}>
            <Input
              name="name"
              type="text"
              label={requiredFieldLabel("Nombre")}
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              disabled={fieldsLocked}
              readOnly={isArchived}
              required
            />

            <div className={`admin-field ${styles.field}`}>
              <span className="ui-label">Categoría</span>
              <p className={styles.categoryReadOnlyValue}>{categoryName}</p>
            </div>
          </div>

          <label className={`ui-field ${styles.field}`}>
            <span className="ui-label">Descripción</span>
            <textarea
              className={`ui-input ${styles.textarea}`}
              name="description"
              rows={3}
              value={descriptionValue}
              onChange={(event) => setDescriptionValue(event.target.value)}
              disabled={fieldsLocked}
              readOnly={isArchived}
            />
          </label>
        </div>

        <hr className={styles.divider} />

        <div className={styles.formSection}>
          <div className={styles.grid3}>
            <div className={`ui-field ${styles.field}`}>
              <label className="ui-label" htmlFor="edit-product-price">
                {requiredFieldLabel("Precio")}
              </label>
              <div className={styles.currencyInputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  id="edit-product-price"
                  name="price"
                  type="number"
                  className="ui-input"
                  min="0"
                  step="0.01"
                  value={priceValue}
                  onChange={(event) => setPriceValue(event.target.value)}
                  disabled={fieldsLocked}
                  readOnly={isArchived}
                  required
                />
              </div>
            </div>

            <div className={`ui-field ${styles.field}`}>
              <div className={styles.labelRow}>
                <label className="ui-label" htmlFor="edit-product-sku">
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
                id="edit-product-sku"
                name="sku"
                type="text"
                className="ui-input"
                value={skuValue}
                onChange={(event) => setSkuValue(event.target.value)}
                disabled={fieldsLocked}
                readOnly={isArchived}
              />
            </div>

            <Input
              id="edit-product-stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              label={requiredFieldLabel("Stock actual")}
              value={String(stockValue)}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setStockValue(Number.isFinite(next) ? next : 0);
              }}
              disabled={fieldsLocked}
              readOnly={isArchived}
              required
              aria-describedby={
                trackStock && stockValue <= 0 ? "edit-stock-zero-info" : undefined
              }
            />
          </div>

          <div className={`${styles.toggleStack} ${styles.editOperationalSection}`}>
            <div className={styles.toggleStackHeader}>
              <span className={styles.toggleLabel} id="edit-available-label">
                Disponible
              </span>
              <div className={`${toggleStyles.toggleHost} ${styles.editToggleHost}`}>
                <label className={toggleStyles.switch}>
                  <input
                    name="is_available"
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(event) => setIsAvailable(event.target.checked)}
                    disabled={fieldsLocked}
                    aria-labelledby="edit-available-label"
                  />
                  <span className={toggleStyles.slider} />
                </label>
              </div>
            </div>

            <div className={styles.toggleStackHeader}>
              <span className={styles.toggleLabel} id="edit-track-stock-label">
                Controlar stock automáticamente
              </span>
              <div className={`${toggleStyles.toggleHost} ${styles.editToggleHost}`}>
                <label className={toggleStyles.switch}>
                  <input
                    name="track_stock"
                    type="checkbox"
                    checked={trackStock}
                    onChange={(event) => setTrackStock(event.target.checked)}
                    disabled={fieldsLocked}
                    aria-labelledby="edit-track-stock-label"
                    aria-describedby="edit-track-stock-helper"
                  />
                  <span className={toggleStyles.slider} />
                </label>
              </div>
            </div>
            <p id="edit-track-stock-helper" className={styles.toggleHelper}>
              Al activar el control, el stock se descuenta automáticamente con cada pedido. Si
              llega a 0, el producto deja de estar disponible. Al reponer stock, volvé a marcarlo
              como disponible cuando quieras publicarlo.
            </p>
            {trackStock && stockValue <= 0 ? (
              <p id="edit-stock-zero-info" className={styles.toggleInfo} role="status">
                Con control de stock activo y stock 0, este producto quedará no disponible.
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.feedback}>
          {imageError ? <p className="admin-feedback admin-feedback--error">{imageError}</p> : null}
          {customizationLoadError ? (
            <p className="admin-feedback admin-feedback--error">{customizationLoadError}</p>
          ) : null}
          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {state.success ? (
            <p className="admin-feedback admin-feedback--success">Producto actualizado.</p>
          ) : null}
        </div>

        <ProductCustomizationOverridesPanel
          productId={product.id}
          productName={product.name}
          mode="draft"
          readOnly={isArchived}
          hiddenGroupIds={hiddenGroupIds}
          hiddenOptionIds={hiddenOptionIds}
          onToggleGroupHidden={handleToggleGroupHidden}
          onToggleOptionHidden={handleToggleOptionHidden}
          onCustomizationBaseline={handleCustomizationBaseline}
          onCustomizationLoadError={handleCustomizationLoadError}
          onCustomizationLoading={handleCustomizationLoading}
        />

        <section className={styles.lifecycleSection} aria-labelledby="edit-product-lifecycle-title">
          <h3 id="edit-product-lifecycle-title" className={styles.lifecycleTitle}>
            Gestión del producto
          </h3>
          <div className={styles.lifecycleActions}>
            {isArchived ? (
              <button
                ref={restoreTriggerRef}
                type="button"
                className={styles.lifecycleRestoreButton}
                disabled={lifecyclePending}
                onClick={() => {
                  void runRestoreProduct();
                }}
              >
                <RotateCcw aria-hidden="true" size={17} strokeWidth={2} />
                <span>{lifecyclePending ? "Restaurando..." : "Restaurar"}</span>
              </button>
            ) : (
              <button
                ref={archiveTriggerRef}
                type="button"
                className={styles.lifecycleArchiveButton}
                disabled={lifecyclePending || isPending}
                onClick={() => requestLifecycleAction("archive")}
              >
                <Archive aria-hidden="true" size={17} strokeWidth={2} />
                <span>Archivar</span>
              </button>
            )}
            <button
              ref={deleteTriggerRef}
              type="button"
              className={styles.lifecycleDeleteButton}
              disabled={lifecyclePending || isPending}
              onClick={() => requestLifecycleAction("delete")}
            >
              <Trash2 aria-hidden="true" size={17} strokeWidth={2} />
              <span>Eliminar</span>
            </button>
          </div>
        </section>

        {!isArchived ? (
          <div
            className={`${styles.actions} ${styles.actionsSticky} ${styles.editActions}`}
          >
            <Button
              type="submit"
              className="admin-primary-button"
              disabled={!canSave || lifecyclePending}
              variant="primary"
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        ) : null}
      </form>

      <dialog
        ref={discardDialogRef}
        className={styles.discardDialog}
        data-edit-product-confirm="true"
        aria-labelledby="edit-product-discard-title"
        aria-describedby="edit-product-discard-desc"
        onClose={handleDiscardDialogClose}
      >
        <div className={styles.discardDialogBody}>
          <h3 id="edit-product-discard-title" className={styles.discardDialogTitle}>
            ¿Descartar cambios?
          </h3>
          <p id="edit-product-discard-desc" className={styles.discardDialogCopy}>
            Tenés cambios sin guardar. Si cerrás ahora, se perderán.
          </p>
          <div className={styles.discardDialogActions}>
            <button
              ref={stayEditingButtonRef}
              type="button"
              className={styles.discardDialogStay}
              onClick={handleStayEditing}
            >
              Seguir editando
            </button>
            <button
              type="button"
              className={styles.discardDialogConfirm}
              onClick={handleConfirmDiscard}
            >
              Descartar cambios
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={archiveDialogRef}
        className={styles.discardDialog}
        data-edit-product-confirm="true"
        aria-labelledby="edit-product-archive-title"
        aria-describedby="edit-product-archive-desc"
        onClose={handleArchiveDialogClose}
      >
        <div className={styles.discardDialogBody}>
          <h3 id="edit-product-archive-title" className={styles.discardDialogTitle}>
            Archivar producto
          </h3>
          <p id="edit-product-archive-desc" className={styles.discardDialogCopy}>
            El producto dejará de mostrarse en el catálogo y no podrás editarlo hasta que lo
            restaures. Sus datos se conservarán.
          </p>
          <div className={styles.discardDialogActions}>
            <button
              ref={archiveCancelButtonRef}
              type="button"
              className={styles.discardDialogStay}
              disabled={lifecyclePending}
              onClick={handleCancelArchiveConfirm}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.lifecycleArchiveConfirm}
              disabled={lifecyclePending}
              onClick={() => {
                void runArchiveProduct();
              }}
            >
              {lifecyclePending ? "Archivando..." : "Archivar"}
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={deleteDialogRef}
        className={styles.discardDialog}
        data-edit-product-confirm="true"
        aria-labelledby="edit-product-delete-title"
        aria-describedby="edit-product-delete-desc"
        onClose={handleDeleteDialogClose}
      >
        <div className={styles.discardDialogBody}>
          <h3 id="edit-product-delete-title" className={styles.discardDialogTitle}>
            Eliminar producto
          </h3>
          <p id="edit-product-delete-desc" className={styles.discardDialogCopy}>
            El producto se eliminará permanentemente. Esta acción no se puede deshacer.
          </p>
          <div className={styles.discardDialogActions}>
            <button
              ref={deleteCancelButtonRef}
              type="button"
              className={styles.discardDialogStay}
              disabled={lifecyclePending}
              onClick={handleCancelDeleteConfirm}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.lifecycleDangerButton}
              disabled={lifecyclePending}
              onClick={() => {
                void runDeleteProduct();
              }}
            >
              {lifecyclePending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}
