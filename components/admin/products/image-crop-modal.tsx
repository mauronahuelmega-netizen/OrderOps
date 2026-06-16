"use client";

import "./vendor/react-easy-crop.css";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/cropImage";
import styles from "./image-crop-modal.module.css";

type ImageCropModalProps = {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
};

export default function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="image-crop-modal-title">
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
            <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isApplying}>
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
