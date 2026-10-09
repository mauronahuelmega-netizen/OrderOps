"use client";

import {
  useEffect,
  useId,
  useState,
  useTransition,
  type ChangeEvent,
  type SyntheticEvent
} from "react";
import { useRouter } from "next/navigation";
import { setProductAvailabilityAction } from "@/app/admin/(protected)/products/actions";
import styles from "./product-availability-toggle.module.css";

const AVAILABILITY_UNEXPECTED_ERROR =
  "No pudimos actualizar la disponibilidad. Intentá nuevamente.";

type ProductAvailabilityToggleProps = {
  productId: string;
  productName: string;
  initialIsAvailable: boolean;
  /** When true, enabling availability is not offered (tracked + zero stock). */
  disableEnable?: boolean;
  /** Desktop table keeps the text label; cards rely on the status chip. */
  showStatusLabel?: boolean;
};

export default function ProductAvailabilityToggle({
  productId,
  productName,
  initialIsAvailable,
  disableEnable = false,
  showStatusLabel = true
}: ProductAvailabilityToggleProps) {
  const router = useRouter();
  const errorId = useId();
  const [confirmedIsAvailable, setConfirmedIsAvailable] = useState(initialIsAvailable);
  const [optimisticIsAvailable, setOptimisticIsAvailable] = useState(initialIsAvailable);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setConfirmedIsAvailable(initialIsAvailable);
    setOptimisticIsAvailable(initialIsAvailable);
  }, [initialIsAvailable]);

  const cannotEnable = disableEnable && !optimisticIsAvailable;
  const disabled = isPending || cannotEnable;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (isPending) {
      return;
    }

    const previousValue = confirmedIsAvailable;
    const nextValue = event.currentTarget.checked;

    if (nextValue && disableEnable) {
      return;
    }

    setErrorMessage(null);
    setOptimisticIsAvailable(nextValue);

    startTransition(async () => {
      try {
        const result = await setProductAvailabilityAction(productId, nextValue);

        if (result.error) {
          setOptimisticIsAvailable(previousValue);
          setErrorMessage(result.error || AVAILABILITY_UNEXPECTED_ERROR);
          return;
        }

        setConfirmedIsAvailable(nextValue);
        setOptimisticIsAvailable(nextValue);
        setErrorMessage(null);
        router.refresh();
      } catch {
        setOptimisticIsAvailable(previousValue);
        setErrorMessage(AVAILABILITY_UNEXPECTED_ERROR);
      }
    });
  }

  function isolateInteraction(event: SyntheticEvent) {
    event.stopPropagation();
  }

  const ariaLabel = optimisticIsAvailable
    ? `Marcar ${productName} como no disponible`
    : `Marcar ${productName} como disponible`;

  return (
    <div
      className={styles.toggleHost}
      onClick={isolateInteraction}
      onKeyDown={isolateInteraction}
      onPointerDown={isolateInteraction}
    >
      <div className={styles.toggleRow}>
        <label className={styles.switch}>
          <input
            type="checkbox"
            role="switch"
            checked={optimisticIsAvailable}
            onChange={handleChange}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-busy={isPending || undefined}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? errorId : undefined}
          />
          <span className={styles.slider} />
        </label>
        {showStatusLabel ? (
          <span className={styles.statusLabel} aria-hidden="true">
            {optimisticIsAvailable ? "Disponible" : "No disponible"}
          </span>
        ) : null}
      </div>
      {errorMessage ? (
        <p id={errorId} className={`admin-feedback admin-feedback--error ${styles.error}`} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
