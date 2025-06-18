"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settings-store";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { applyTheme } = useSettingsStore();

  useEffect(() => {
    // Apply theme on mount
    applyTheme();
  }, [applyTheme]);

  return <>{children}</>;
}
