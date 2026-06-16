"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductAvailabilityAction } from "@/app/admin/(protected)/products/actions";
import styles from "./product-availability-toggle.module.css";

type ProductAvailabilityToggleProps = {
  productId: string;
  initialIsAvailable: boolean;
};

export default function ProductAvailabilityToggle({
  productId,
  initialIsAvailable
}: ProductAvailabilityToggleProps) {
  const router = useRouter();
  const [optimisticIsAvailable, setOptimisticIsAvailable] = useState(initialIsAvailable);
  const [, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const previousValue = optimisticIsAvailable;
    const nextValue = event.currentTarget.checked;

    setOptimisticIsAvailable(nextValue);

    startTransition(async () => {
      const result = await setProductAvailabilityAction(productId, nextValue);

      if (result.error) {
        setOptimisticIsAvailable(previousValue);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className={styles.toggleHost}>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={optimisticIsAvailable}
          onChange={handleChange}
          aria-label={optimisticIsAvailable ? "Marcar producto como inactivo" : "Marcar producto como activo"}
        />
        <span className={styles.slider} />
      </label>
      <span className={styles.statusLabel} aria-hidden="true">
        {optimisticIsAvailable ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}
