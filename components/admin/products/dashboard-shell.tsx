"use client";

import type { ReactNode } from "react";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  children: ReactNode;
  toolbar?: ReactNode;
  flyout?: ReactNode;
};

export default function DashboardShell({ children, toolbar, flyout }: DashboardShellProps) {
  return (
    <div className={styles.shell}>
      {toolbar}
      <div className={styles.content}>{children}</div>
      {flyout ? <div className={styles.flyoutSlot}>{flyout}</div> : null}
    </div>
  );
}
