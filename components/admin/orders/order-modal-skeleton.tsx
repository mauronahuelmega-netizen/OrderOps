import modalStyles from "./admin-order-modal.module.css";
import styles from "./order-modal-skeleton.module.css";

function SkeletonBone({
  className,
  block = false
}: {
  className?: string;
  block?: boolean;
}) {
  return (
    <div
      className={[styles.skeleton, block ? styles.skeletonBlock : null, className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}

function ProductRowSkeleton() {
  return (
    <div className={styles.productRow}>
      <SkeletonBone block className={styles.productRowTitle} />
      <SkeletonBone block className={styles.productRowPrice} />
    </div>
  );
}

export function OrderModalWorkspaceSkeleton() {
  return (
    <div
      className={styles.workspaceSkeleton}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando pedido"
    >
      <span className="sr-only">Cargando pedido</span>
      <div className={modalStyles.workspaceGrid}>
        <div className={modalStyles.executionColumn}>
          <div>
            <SkeletonBone block className={styles.sectionLabel} />
            <div className={styles.productRows}>
              <ProductRowSkeleton />
              <ProductRowSkeleton />
              <ProductRowSkeleton />
            </div>
            <div className={styles.totalCard}>
              <SkeletonBone block className={styles.totalLabel} />
              <SkeletonBone block className={styles.totalValue} />
            </div>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewGrid}>
              <div>
                <SkeletonBone block className={styles.overviewCellLabel} />
                <SkeletonBone block className={styles.overviewCellValue} />
              </div>
              <div>
                <SkeletonBone block className={styles.overviewCellLabel} />
                <SkeletonBone block className={styles.overviewCellValue} />
              </div>
              <div>
                <SkeletonBone block className={styles.overviewCellLabel} />
                <SkeletonBone block className={styles.overviewCellValue} />
              </div>
              <div>
                <SkeletonBone block className={styles.overviewCellLabel} />
                <SkeletonBone block className={styles.overviewCellValue} />
              </div>
            </div>
          </div>

          <div className={styles.timelineCard}>
            <SkeletonBone block className={styles.sectionLabel} />
            <div className={styles.timelineItem}>
              <SkeletonBone className={styles.timelineDot} />
              <div className={styles.timelineCopy}>
                <SkeletonBone block className={styles.timelineTitle} />
                <SkeletonBone block className={styles.timelineMeta} />
              </div>
            </div>
            <div className={styles.timelineItem}>
              <SkeletonBone className={styles.timelineDot} />
              <div className={styles.timelineCopy}>
                <SkeletonBone block className={styles.timelineTitle} />
                <SkeletonBone block className={styles.timelineMeta} />
              </div>
            </div>
          </div>

          <div className={styles.notesBlock}>
            <SkeletonBone block className={styles.sectionLabel} />
            <SkeletonBone block className={styles.notesLine} />
            <SkeletonBone block className={styles.notesLineShort} />
          </div>
        </div>

        <div className={modalStyles.commandColumn}>
          <div className={styles.recommendedPanel}>
            <SkeletonBone block className={styles.recommendedEyebrow} />
            <SkeletonBone block className={styles.recommendedTitle} />
            <SkeletonBone block className={styles.recommendedDescription} />
          </div>

          <div className={styles.controlGroup}>
            <SkeletonBone block className={styles.controlGroupTitle} />
            <SkeletonBone block className={styles.controlSelect} />
            <SkeletonBone block className={styles.controlButton} />
            <SkeletonBone block className={styles.controlSelect} />
          </div>

          <div className={styles.controlGroup}>
            <SkeletonBone block className={styles.controlGroupTitle} />
            <SkeletonBone block className={styles.commSelect} />
            <SkeletonBone block className={styles.commButton} />
            <div className={styles.quickGrid}>
              <SkeletonBone block className={styles.quickButton} />
              <SkeletonBone block className={styles.quickButton} />
              <SkeletonBone block className={styles.quickButton} />
              <SkeletonBone block className={styles.quickButton} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
