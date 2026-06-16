import type { HTMLAttributes, ReactNode } from "react";
import styles from "./empty-state.module.css";

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

function DefaultEmptyIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
      <path d="M8 11h6" />
    </svg>
  );
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(" ")} {...props}>
      {icon ?? <DefaultEmptyIcon />}

      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>

      {actionLabel && onAction ? (
        <button type="button" className={styles.button} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
