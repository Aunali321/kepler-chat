'use client';

import { useEffect } from 'react';
import { useSettingsStore, useThemeWatcher } from '@/lib/stores/settings-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, applyTheme } = useSettingsStore();
  
  // Initialize theme watcher for system theme changes
  useThemeWatcher();

  useEffect(() => {
    // Apply theme on mount and when theme changes
    applyTheme();
  }, [theme, applyTheme]);

  useEffect(() => {
    // Listen for system theme changes when theme is set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        applyTheme();
      };

      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme, applyTheme]);

  return <>{children}</>;
}