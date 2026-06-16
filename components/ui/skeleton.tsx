import type { HTMLAttributes } from "react";
import styles from "./skeleton.module.css";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.skeleton, className].filter(Boolean).join(" ")} {...props} />;
}
