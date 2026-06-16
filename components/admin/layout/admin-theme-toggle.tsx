"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./admin-sidebar.module.css";

const THEME_STORAGE_KEY = "orderops-theme";

type AdminTheme = "dark" | "light";

function getInitialTheme(): AdminTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const domTheme = document.documentElement.getAttribute("data-dashboard-theme");

  if (domTheme === "dark" || domTheme === "light") {
    return domTheme;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return "light";
}

function applyAdminTheme(theme: AdminTheme) {
  document.documentElement.setAttribute("data-dashboard-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

type AdminThemeToggleProps = {
  layout?: "sidebar" | "drawer";
};

export default function AdminThemeToggle({ layout = "sidebar" }: AdminThemeToggleProps) {
  const [isDark, setIsDark] = useState(
    () => typeof window !== "undefined" && getInitialTheme() === "dark"
  );

  useEffect(() => {
    const theme = getInitialTheme();

    setIsDark(theme === "dark");
    applyAdminTheme(theme);
  }, []);

  const toggleTheme = () => {
    setIsDark((current) => {
      const nextIsDark = !current;
      const theme: AdminTheme = nextIsDark ? "dark" : "light";

      localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyAdminTheme(theme);

      return nextIsDark;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        layout === "drawer" ? styles.appearanceControlDrawer : styles.appearanceControl
      }
      aria-pressed={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span className={styles.appearanceLabel}>Apariencia</span>
      <span className={styles.themeSwitch} aria-hidden="true">
        <Sun
          strokeWidth={1.75}
          className={`${styles.themeSwitchIcon} ${
            !isDark ? styles.themeSwitchIconActive : ""
          }`}
        />
        <span
          className={`${styles.themeSwitchTrack} ${
            isDark ? styles.themeSwitchTrackDark : styles.themeSwitchTrackLight
          }`}
        >
          <span className={styles.themeSwitchThumb} />
        </span>
        <Moon
          strokeWidth={1.75}
          className={`${styles.themeSwitchIcon} ${
            isDark ? styles.themeSwitchIconActive : ""
          }`}
        />
      </span>
    </button>
  );
}
