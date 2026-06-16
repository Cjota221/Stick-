"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "sticke-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(preferred);
    applyTheme(preferred);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="st-btn-ghost inline-flex min-h-10 items-center gap-2 px-3 py-2 text-xs font-semibold sm:px-4"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={theme === "dark" ? "Tema escuro" : "Tema claro"}
    >
      <span className="text-sm" aria-hidden="true">
        {theme === "dark" ? "☾" : "☼"}
      </span>
      <span className="hidden sm:inline">{theme === "dark" ? "Escuro" : "Claro"}</span>
    </button>
  );
}
