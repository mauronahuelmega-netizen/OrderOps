"use client";

import { useEffect, useRef } from "react";
import styles from "./audio-unlock-modal.module.css";

type AudioUnlockModalProps = {
  error: string | null;
  isOpen: boolean;
  isPending: boolean;
  onActivate: () => void;
};

export default function AudioUnlockModal({
  error,
  isOpen,
  isPending,
  onActivate
}: AudioUnlockModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    primaryButtonRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles["admin-audio-unlock-modal"]} aria-hidden={false}>
      <button
        type="button"
        className={styles["admin-audio-unlock-modal__overlay"]}
        aria-label="Preparar sonido de nuevos pedidos"
        onClick={onActivate}
        disabled={isPending}
      />
      <div
        className={styles["admin-audio-unlock-modal__panel"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-audio-unlock-modal-title"
        aria-describedby="admin-audio-unlock-modal-description admin-audio-unlock-modal-detail"
      >
        <div className="admin-form-header">
          <h2 id="admin-audio-unlock-modal-title">Preparar sonido de nuevos pedidos</h2>
          <p id="admin-audio-unlock-modal-description">
            Tocá una vez la pantalla para que OrderOps pueda reproducir el aviso sonoro.
          </p>
          <p
            id="admin-audio-unlock-modal-detail"
            className={styles["admin-audio-unlock-modal__hint"]}
          >
            Así vas a escuchar cuando entre un pedido nuevo, incluso si estás usando otra
            pestaña.
          </p>
        </div>

        {error ? <p className="admin-feedback admin-feedback--error">{error}</p> : null}

        <div className={styles["admin-audio-unlock-modal__actions"]}>
          <button
            ref={primaryButtonRef}
            type="button"
            className={styles.primaryAction}
            onClick={onActivate}
            disabled={isPending}
          >
            Preparar sonido
          </button>
        </div>
      </div>
    </div>
  );
}
