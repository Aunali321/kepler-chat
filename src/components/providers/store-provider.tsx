"use client";

import { ThemeProvider } from "./theme-provider";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { DynamicStyles } from "@/components/ui/dynamic-styles";

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <ThemeProvider>
      <DynamicStyles />
      {children}
      <NotificationProvider />
    </ThemeProvider>
  );
}
