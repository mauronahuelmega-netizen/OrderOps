import Link from "next/link";
import { ChevronRight } from "lucide-react";
import styles from "./settings-hub-index.module.css";

export type SettingsHubIndexItem = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  status?: string;
};

export type SettingsHubIndexSection = {
  id: string;
  title: string;
  description: string;
  items: SettingsHubIndexItem[];
};

type SettingsHubIndexProps = {
  sections: SettingsHubIndexSection[];
};

export default function SettingsHubIndex({ sections }: SettingsHubIndexProps) {
  return (
    <div className={styles.index}>
      {sections.map((section) => (
        <section
          key={section.id}
          className={styles.section}
          aria-labelledby={`settings-hub-${section.id}`}
        >
          <header className={styles.sectionHeader}>
            <h2 id={`settings-hub-${section.id}`} className={styles.sectionTitle}>
              {section.title}
            </h2>
            <p className={styles.sectionDescription}>{section.description}</p>
          </header>

          <ul className={styles.list}>
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.item}
                  aria-label={`${item.title}: ${item.actionLabel}`}
                >
                  <div className={styles.itemCopy}>
                    <div className={styles.itemHeadline}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      {item.status ? (
                        <span className={styles.itemStatus}>{item.status}</span>
                      ) : null}
                    </div>
                    <p className={styles.itemDescription}>{item.description}</p>
                  </div>

                  <span className={styles.itemAction}>
                    <span className={styles.itemActionLabel}>{item.actionLabel}</span>
                    <ChevronRight className={styles.itemChevron} aria-hidden="true" strokeWidth={2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
