import { Skeleton } from "@/components/ui/skeleton";
import styles from "./product-catalog-skeleton.module.css";

type ProductCatalogSkeletonProps = {
  includeToolbar?: boolean;
};

export default function ProductCatalogSkeleton({
  includeToolbar = false
}: ProductCatalogSkeletonProps) {
  return (
    <div>
      {includeToolbar ? (
        <div className={styles.toolbarSkeleton}>
          <Skeleton className={styles.textSkeleton} style={{ width: "250px", height: "36px" }} />
          <div className={styles.filtersSkeleton}>
            <Skeleton className={styles.textSkeleton} style={{ width: "120px", height: "36px" }} />
            <Skeleton className={styles.textSkeleton} style={{ width: "120px", height: "36px" }} />
            <Skeleton className={styles.textSkeleton} style={{ width: "120px", height: "36px" }} />
          </div>
        </div>
      ) : null}

      <div className={styles.dataSurfaceShell}>
        <table className={`${styles.tableSkeleton} ${styles.desktopOnly}`}>
        <thead>
          <tr>
            <th className={styles.headerCellSkeleton} scope="col">
              <Skeleton className={styles.textSkeletonShort} />
            </th>
            <th className={styles.headerCellSkeleton} scope="col">
              <Skeleton className={styles.textSkeletonShort} />
            </th>
            <th className={styles.headerCellSkeleton} scope="col">
              <Skeleton className={styles.textSkeletonShort} />
            </th>
            <th className={`${styles.headerCellSkeleton} ${styles.alignRight}`} scope="col">
              <Skeleton className={styles.textSkeletonShort} style={{ marginLeft: "auto" }} />
            </th>
            <th className={`${styles.headerCellSkeleton} ${styles.alignRight}`} scope="col">
              <Skeleton className={styles.textSkeletonShort} style={{ marginLeft: "auto" }} />
            </th>
            <th className={styles.headerCellSkeleton} scope="col">
              <Skeleton className={styles.textSkeletonShort} />
            </th>
            <th className={`${styles.headerCellSkeleton} ${styles.alignRight}`} scope="col">
              <Skeleton className={styles.actionSkeleton} />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }, (_, index) => (
            <tr key={index} className={styles.rowSkeleton}>
              <td className={styles.cellSkeleton}>
                <Skeleton className={styles.avatarSkeleton} />
              </td>
              <td className={styles.cellSkeleton}>
                <Skeleton className={styles.textSkeleton} style={{ width: "80%" }} />
                <Skeleton className={styles.textSkeletonShort} />
              </td>
              <td className={styles.cellSkeleton}>
                <Skeleton className={styles.textSkeleton} style={{ width: "70%" }} />
              </td>
              <td className={`${styles.cellSkeleton} ${styles.alignRight}`}>
                <Skeleton className={styles.textSkeleton} style={{ width: "60px", marginLeft: "auto" }} />
              </td>
              <td className={`${styles.cellSkeleton} ${styles.alignRight}`}>
                <Skeleton className={styles.textSkeleton} style={{ width: "40px", marginLeft: "auto" }} />
              </td>
              <td className={styles.cellSkeleton}>
                <Skeleton className={styles.badgeSkeleton} />
              </td>
              <td className={`${styles.cellSkeleton} ${styles.alignRight}`}>
                <Skeleton className={styles.actionSkeleton} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

        <div className={styles.paginationSkeleton}>
          <Skeleton className={styles.textSkeletonShort} style={{ width: "180px", height: "14px" }} />
          <div className={styles.paginationControlsSkeleton}>
            <Skeleton className={styles.textSkeletonShort} style={{ width: "72px", height: "32px" }} />
            <Skeleton className={styles.textSkeletonShort} style={{ width: "88px", height: "14px" }} />
            <Skeleton className={styles.textSkeletonShort} style={{ width: "72px", height: "32px" }} />
          </div>
        </div>
      </div>

      <div className={styles.mobileOnly}>
        <div className={styles.mobileCatalogShell}>
          <div className={styles.mobileCatalogHeaderSkeleton}>
            <Skeleton className={styles.textSkeletonShort} style={{ width: "5rem", height: "14px" }} />
            <Skeleton className={styles.textSkeletonShort} style={{ width: "6rem", height: "11px" }} />
          </div>
          <div className={styles.mobileCatalogMetricsSkeleton}>
            <Skeleton className={styles.textSkeletonShort} style={{ width: "70%", height: "12px" }} />
          </div>
          <div className={styles.mobileCardGrid}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className={styles.mobileCardPlaceholder} aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
