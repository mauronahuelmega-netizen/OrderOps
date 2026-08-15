import Link from "next/link";
import styles from "./public-catalog-footer.module.css";

type PublicCatalogFooterProps = {
  businessName: string;
  year: number;
};

export default function PublicCatalogFooter({
  businessName,
  year
}: PublicCatalogFooterProps) {
  return (
    <footer className={styles.footer}>
      <p className={styles.copy}>
        © {year} {businessName} · Pedidos online · Hecho con{" "}
        <Link href="/" className={styles.brandLink}>
          OrderOps
        </Link>
      </p>
    </footer>
  );
}
