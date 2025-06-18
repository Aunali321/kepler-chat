"use client";

import { useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useChatStore } from "@/lib/stores/chat-store";

interface ResponsiveLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function ResponsiveLayout({ sidebar, children }: ResponsiveLayoutProps) {
  const {
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    setIsMobile,
    initialize: initializeUI,
    initializeFromPreferences: initializeUIFromPrefs,
  } = useUIStore();

  const { loadPreferences, preferences } = usePreferencesStore();
  const { initializeSettings } = useSettingsStore();
  const { initializeFromPreferences: initializeChat } = useChatStore();

  // Load preferences once on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Once preferences are loaded, initialize other stores
  useEffect(() => {
    if (preferences) {
      initializeSettings();
      initializeChat();
      initializeUIFromPrefs();
    }
  }, [preferences, initializeSettings, initializeChat, initializeUIFromPrefs]);

  useEffect(() => {
    initializeUI();

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Close mobile sidebar when switching to desktop
      if (!mobile && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [initializeUI, setIsMobile, setSidebarOpen, sidebarOpen, isMobile]);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        ${
          isMobile
            ? `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative"
        }
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      `}
      >
        {sidebar}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <h1 className="text-lg font-semibold">Kepler Chat</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
