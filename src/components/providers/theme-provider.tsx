"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/stores/app-store";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { applyTheme } = useAppStore();

  useEffect(() => {
    // Apply theme on mount
    applyTheme();
  }, [applyTheme]);

  return <>{children}</>;
}
