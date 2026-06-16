import { Skeleton } from "@/components/ui/skeleton";
import styles from "./product-form.module.css";

type SkeletonFieldProps = {
  variant?: "input" | "textarea";
};

function SkeletonField({ variant = "input" }: SkeletonFieldProps) {
  return (
    <div className={styles.skeletonField}>
      <Skeleton className={styles.skeletonLabel} />
      <Skeleton className={variant === "textarea" ? styles.skeletonTextarea : styles.skeletonInput} />
    </div>
  );
}

export default function ProductFormSkeleton() {
  return (
    <>
      <div className={styles.formSection}>
        <Skeleton className={styles.skeletonImage} />

        <div className={styles.grid2}>
          <SkeletonField />
          <SkeletonField />
        </div>

        <SkeletonField variant="textarea" />
      </div>

      <hr className={styles.divider} />

      <div className={styles.formSection}>
        <div className={styles.grid3}>
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>

        <div className={styles.toggleContainer}>
          <Skeleton className={`${styles.skeletonLabel} ${styles.skeletonToggleLabel}`} />
          <Skeleton className={styles.skeletonToggle} />
        </div>
      </div>

      <Skeleton className={styles.skeletonButton} />
    </>
  );
}
