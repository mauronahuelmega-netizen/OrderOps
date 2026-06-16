import sidebarStyles from "./admin-sidebar.module.css";
import styles from "./admin-brand.module.css";

type AdminBrandProps = {
  logoUrl: string | null;
  name: string | null;
  variant?: "sidebar" | "drawer" | "topbar";
  headingId?: string;
};

function getBusinessTitle(name: string | null) {
  return name?.trim() || "Panel del negocio";
}

function getBusinessInitial(name: string | null) {
  return getBusinessTitle(name).charAt(0).toUpperCase() || "O";
}

export default function AdminBrand({
  logoUrl,
  name,
  variant = "sidebar",
  headingId
}: AdminBrandProps) {
  const title = getBusinessTitle(name);
  const initial = getBusinessInitial(name);

  if (variant === "sidebar") {
    return (
      <div className={sidebarStyles.brandContainer}>
        <div className={sidebarStyles.brandIcon}>
          {logoUrl ? (
            <img src={logoUrl} alt={title} className={sidebarStyles.brandLogo} />
          ) : (
            <span className={sidebarStyles.brandLogoFallback} aria-hidden="true">
              {initial}
            </span>
          )}
        </div>

        <div className={sidebarStyles.brandText}>
          <h1 className={sidebarStyles.brandName} title={title}>
            {title}
          </h1>
          <p className={sidebarStyles.brandKicker}>Panel operacional</p>
        </div>
      </div>
    );
  }

  if (variant === "topbar") {
    return (
      <div className={`${styles.brand} ${styles.brandTopbar}`}>
        <div className={styles.logoFrame}>
          {logoUrl ? (
            <img src={logoUrl} alt={title} className={styles.logo} />
          ) : (
            <span className={`${styles.logo} ${styles.logoFallback}`} aria-hidden="true">
              {initial}
            </span>
          )}
        </div>

        <div className={styles.text}>
          <p className={styles.brandName} title={title}>
            {title}
          </p>
          <p className={styles.kicker}>Panel operacional</p>
        </div>
      </div>
    );
  }

  const Heading = "h2";

  return (
    <div className={`${styles.brand} ${styles.brandDrawer}`}>
      <div className={styles.logoFrame}>
        {logoUrl ? (
          <img src={logoUrl} alt={title} className={styles.logo} />
        ) : (
          <span className={`${styles.logo} ${styles.logoFallback}`} aria-hidden="true">
            {initial}
          </span>
        )}
      </div>

      <div className={styles.text}>
        <Heading id={headingId} className={styles.brandName} title={title}>
          {title}
        </Heading>
        <p className={styles.kicker}>Panel operacional</p>
      </div>
    </div>
  );
}
