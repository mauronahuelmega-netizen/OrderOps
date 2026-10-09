"use client";

import "./vendor/react-easy-crop.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/cropImage";
import styles from "./image-crop-modal.module.css";

type ImageCropModalProps = {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.tabIndex !== -1 &&
      element.getClientRects().length > 0
  );
}

export default function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    cancelButtonRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const activeIsInside = active instanceof HTMLElement && dialog.contains(active);

      if (event.shiftKey) {
        if (!activeIsInside || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeIsInside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onCancel]);

  const handleCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApplyCrop() {
    if (!croppedAreaPixels) {
      setError("Esperá a que la imagen termine de cargar.");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedFile);
    } catch {
      setError("No pudimos aplicar el recorte. Intentá de nuevo.");
    } finally {
      setIsApplying(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-modal-title"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalBody}>
          <h3 id="image-crop-modal-title" className={styles.title}>
            Encuadrar imagen
          </h3>

          <div className={styles.cropperContainer}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>

          <div className={styles.zoomRow}>
            <label className={styles.zoomLabel} htmlFor="image-crop-zoom">
              Zoom
            </label>
            <input
              id="image-crop-zoom"
              type="range"
              className={styles.zoomSlider}
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </div>

          {error ? <p className="admin-feedback admin-feedback--error">{error}</p> : null}

          <div className={styles.actions}>
            <button
              ref={cancelButtonRef}
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isApplying}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.applyButton}
              onClick={() => void handleApplyCrop()}
              disabled={isApplying || !croppedAreaPixels}
            >
              {isApplying ? "Aplicando..." : "Aplicar recorte"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
