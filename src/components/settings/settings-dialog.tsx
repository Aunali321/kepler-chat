"use client";

import { useState } from "react";
import { Settings, User, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreferencesForm } from "./preferences-form";
import { ProviderSettings } from "./provider-settings";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "preferences" | "providers";

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Close</span>
              &times;
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs */}
          <div className="w-1/4 border-r border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <Button
              variant={activeTab === "preferences" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("preferences")}
            >
              <User className="w-4 h-4 mr-2" />
              Preferences
            </Button>
            <Button
              variant={activeTab === "providers" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("providers")}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Providers
            </Button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "preferences" && <PreferencesForm />}
            {activeTab === "providers" && <ProviderSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
