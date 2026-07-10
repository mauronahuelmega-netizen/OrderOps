"use client";

import type { DragEvent } from "react";
import { useRef } from "react";
import styles from "./public-asset-upload.module.css";

export type PublicAssetUploadState = "empty" | "published" | "selected" | "uploading";

export type PublicAssetUploadProps = {
  inputId: string;
  label: string;
  variant: "logo" | "cover";
  previewSrc: string | null;
  state: PublicAssetUploadState;
  metadata: string | null;
  hint: string;
  error: string | null;
  status: string | null;
  disabled: boolean;
  changeLabel: string;
  onFileSelected: (file: File) => boolean | void | Promise<boolean | void>;
  onCancelSelection: () => void;
};

export default function PublicAssetUpload({
  inputId,
  label,
  variant,
  previewSrc,
  state,
  metadata,
  hint,
  error,
  status,
  disabled,
  changeLabel,
  onFileSelected,
  onCancelSelection
}: PublicAssetUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const badgeLabel =
    state === "uploading"
      ? "Subiendo..."
      : state === "selected"
        ? "Seleccionado"
        : state === "published"
          ? "Publicado"
          : "Sin imagen";

  const badgeClass =
    state === "uploading"
      ? styles.badgeUploading
      : state === "selected"
        ? styles.badgeSelected
        : state === "published"
          ? styles.badgePublished
          : styles.badgeEmpty;

  const dropzoneClass = [
    styles.dropzone,
    variant === "logo" ? styles.dropzoneLogo : styles.dropzoneCover,
    previewSrc ? styles.dropzoneHasImage : "",
    state === "uploading" ? styles.dropzoneBusy : ""
  ]
    .filter(Boolean)
    .join(" ");

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  async function acceptFile(file: File) {
    const accepted = await onFileSelected(file);

    if (accepted === false && inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || state === "uploading") {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void acceptFile(file);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void acceptFile(file);
    }
  }

  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>

      <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>

      <label
        className={dropzoneClass}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || state === "uploading"}
          onChange={handleInputChange}
        />

        {previewSrc ? (
          <img src={previewSrc} alt={`Vista previa de ${label.toLowerCase()}`} />
        ) : (
          <div className={styles.emptyState}>
            <strong>Arrastrá o elegí una imagen</strong>
            <span>JPG, PNG o WebP</span>
          </div>
        )}
      </label>

      {metadata ? <p className={styles.meta}>{metadata}</p> : null}

      <div className={styles.actions}>
        <label className={styles.changeButton} htmlFor={inputId}>
          {changeLabel}
        </label>

        {state === "selected" ? (
          <button
            type="button"
            className={styles.cancelButton}
            disabled={disabled}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
              }

              onCancelSelection();
            }}
          >
            Cancelar selección
          </button>
        ) : null}
      </div>

      <p className={styles.hint}>{hint}</p>

      {!error && status ? (
        <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{status}</p>
      ) : null}
      {error ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{error}</p> : null}
    </div>
  );
}
