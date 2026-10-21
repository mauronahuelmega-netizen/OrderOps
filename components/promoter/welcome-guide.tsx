"use client";

import { useState } from "react";
import { setWelcomeDismissed } from "@/app/promoter/actions";
import { welcomeDismissedAfterWrite } from "@/lib/commercial/promoters/welcome-write";
import { WelcomeGuideView, welcomeGuideButtonLabel, welcomeGuideVisible } from "./welcome-guide-view";
import styles from "./welcome-guide.module.css";

type Step = { label: string; done: boolean };

export function WelcomeGuide({
  readOk,
  dismissedAt,
  steps
}: {
  readOk: boolean;
  dismissedAt: string | null;
  steps: Step[];
}) {
  const [dismissed, setDismissed] = useState(readOk && dismissedAt !== null);
  const [writeError, setWriteError] = useState(false);
  const [pending, setPending] = useState(false);

  async function persist(next: boolean) {
    setWriteError(false);
    setPending(true);
    try {
      const result = await setWelcomeDismissed(next);
      const applied = welcomeDismissedAfterWrite(result.ok === true, next);
      if (applied.dismissed !== null) setDismissed(applied.dismissed);
      setWriteError(applied.writeError);
    } catch {
      const applied = welcomeDismissedAfterWrite(false, next);
      setWriteError(applied.writeError);
    } finally {
      setPending(false);
    }
  }

  const visible = welcomeGuideVisible(readOk, dismissed);

  return (
    <WelcomeGuideView
      className={styles.guide}
      completedClassName={styles.completed}
      headerRowClassName={styles.headerRow}
      titleGroupClassName={styles.titleGroup}
      statusBadgeClassName={styles.statusBadge}
      checkIconClassName={styles.checkIcon}
      noteClassName={styles.note}
      readOk={readOk}
      visible={visible}
      writeError={writeError}
      pending={pending}
      buttonLabel={welcomeGuideButtonLabel(dismissed)}
      steps={steps}
      onPress={() => void persist(!dismissed)}
    />
  );
}
