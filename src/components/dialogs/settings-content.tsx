"use client";

import { useState } from "react";
import { User, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ProviderSettings } from "@/components/settings/provider-settings";

type SettingsTab = "preferences" | "providers";

interface SettingsContentProps {
  onClose: () => void;
}

export function SettingsContent({ onClose }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");

  return (
    <div className="flex h-full min-h-[500px]">
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
  );
}