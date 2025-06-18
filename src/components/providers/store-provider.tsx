'use client';

import { useEffect } from 'react';
import { ThemeProvider } from './theme-provider';
import { NotificationProvider } from '@/components/ui/notification-provider';
import { DynamicStyles } from '@/components/ui/dynamic-styles';
import { useUIStore } from '@/lib/stores/ui-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useProviderStore } from '@/lib/stores/provider-store';
import { initializeChatData } from '@/lib/stores/chat-data-store';

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { initialize: initializeUI, loadFromSettings: loadUISettings } = useUIStore();
  const { loadPreferences: loadSettings } = useSettingsStore();
  const { loadProviders } = useProviderStore();

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing app-level settings...');
      try {
        // Load settings first (this affects all other stores)
        await loadSettings();
        console.log('✅ App-level settings loaded');
        
        // Load UI settings from preferences
        await loadUISettings();
        console.log('✅ UI settings loaded');
        
        // Load provider configurations
        await loadProviders();
        console.log('✅ Provider configurations loaded');
        
        // Initialize UI store for responsive detection
        initializeUI();
        console.log('✅ UI store initialized');
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        // Still initialize UI even if settings fail
        initializeUI();
      }
    };
    
    initializeApp();
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider>
      <DynamicStyles />
      {children}
      <NotificationProvider />
    </ThemeProvider>
  );
}