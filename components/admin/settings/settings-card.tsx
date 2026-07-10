import Link from "next/link";
import styles from "./settings-card.module.css";

type SettingsCardProps = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

export default function SettingsCard({
  title,
  description,
  href,
  actionLabel
}: SettingsCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      <Link href={href} className={styles.action}>
        {actionLabel}
      </Link>
    </article>
  );
}
