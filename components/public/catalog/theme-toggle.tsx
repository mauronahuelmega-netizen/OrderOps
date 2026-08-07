"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="catalog-theme-switch catalog-theme-switch--placeholder" aria-hidden="true" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`catalog-theme-switch${isDark ? " catalog-theme-switch--dark" : ""}`}
      onClick={onToggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
    >
      <span className="catalog-theme-switch__track">
        <span className="catalog-theme-switch__icon" aria-hidden="true">
          <Sun aria-hidden="true" focusable="false" />
        </span>
        <span className="catalog-theme-switch__icon" aria-hidden="true">
          <Moon aria-hidden="true" focusable="false" />
        </span>
        <span className="catalog-theme-switch__thumb" aria-hidden="true" />
      </span>
    </button>
  );
}
