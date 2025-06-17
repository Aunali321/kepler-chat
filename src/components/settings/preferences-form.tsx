'use client';

import { useEffect } from 'react';
import { Save, Palette, Globe, Settings, Bell, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useProviderStore } from '@/lib/stores/provider-store';
import { ProviderSettings } from './provider-settings';

export function PreferencesForm() {
  const {
    // State
    theme,
    language,
    defaultModel,
    defaultProvider,
    chatSettings,
    uiSettings,
    notificationSettings,
    isLoading,
    isSaving,
    hasChanges,
    // Actions
    loadPreferences,
    savePreferences,
    updatePreference,
    updateChatSetting,
    updateUISetting,
    updateNotificationSetting,
  } = useSettingsStore();

  const {
    providers,
    getAvailableProviders,
    getAvailableModels,
    loadProviders,
  } = useProviderStore();

  useEffect(() => {
    // Load preferences and providers on component mount
    loadPreferences();
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get all available models from enabled providers
  const getAvailableModelsForDropdown = () => {
    const availableProviders = getAvailableProviders();
    const allModels: Array<{ value: string; label: string; provider: string }> = [];

    availableProviders.forEach(providerId => {
      const models = getAvailableModels(providerId);
      models.forEach(model => {
        allModels.push({
          value: model.id,
          label: `${model.displayName} (${providerId})`,
          provider: providerId,
        });
      });
    });

    return allModels;
  };

  const availableModels = getAvailableModelsForDropdown();
  const availableProviders = getAvailableProviders();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const chatSettingsObj = (chatSettings as any) || {};
  const uiSettingsObj = (uiSettings as any) || {};
  const notificationSettingsObj = (notificationSettings as any) || {};

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Appearance
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              value={theme || 'system'}
              onChange={(e) => updatePreference('theme', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <select
              id="fontSize"
              value={uiSettingsObj.fontSize || 'medium'}
              onChange={(e) => updateUISetting('fontSize', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <Label htmlFor="sidebarWidth">Sidebar Width</Label>
            <select
              id="sidebarWidth"
              value={uiSettingsObj.sidebarWidth || 'normal'}
              onChange={(e) => updateUISetting('sidebarWidth', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="narrow">Narrow</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Language & Region */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Language & Region
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={language || 'en'}
              onChange={(e) => updatePreference('language', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={uiSettingsObj.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              onChange={(e) => updateUISetting('timezone', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Chat Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Chat Settings
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="defaultModel">Default AI Model</Label>
            <select
              id="defaultModel"
              value={defaultModel || (availableModels[0]?.value || '')}
              onChange={(e) => updatePreference('defaultModel', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
              disabled={availableModels.length === 0}
            >
              {availableModels.length === 0 ? (
                <option value="">No models available - configure providers first</option>
              ) : (
                availableModels.map(model => (
                  <option key={`${model.provider}-${model.value}`} value={model.value}>
                    {model.label}
                  </option>
                ))
              )}
            </select>
            {availableModels.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Add and validate API keys in the AI Service Providers section below to see available models.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="defaultProvider">Default Provider</Label>
            <select
              id="defaultProvider"
              value={defaultProvider || (availableProviders[0] || '')}
              onChange={(e) => updatePreference('defaultProvider', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
              disabled={availableProviders.length === 0}
            >
              {availableProviders.length === 0 ? (
                <option value="">No providers available - configure providers first</option>
              ) : (
                availableProviders.map(providerId => (
                  <option key={providerId} value={providerId}>
                    {providerId.charAt(0).toUpperCase() + providerId.slice(1)}
                  </option>
                ))
              )}
            </select>
            {availableProviders.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Add and validate API keys in the AI Service Providers section below to see available providers.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={chatSettingsObj.autoSave !== false}
                onChange={(e) => updateChatSetting('autoSave', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="autoSave">Auto-save conversations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="streamingResponses"
                checked={chatSettingsObj.streamingResponses !== false}
                onChange={(e) => updateChatSetting('streamingResponses', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="streamingResponses">Enable streaming responses</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showTokenCount"
                checked={chatSettingsObj.showTokenCount === true}
                onChange={(e) => updateChatSetting('showTokenCount', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showTokenCount">Show token usage</Label>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Service Providers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          AI Service Providers
        </h3>
        <ProviderSettings />
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h3>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="chatNotifications"
              checked={notificationSettingsObj.chatNotifications !== false}
              onChange={(e) => updateNotificationSetting('chatNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="chatNotifications">Chat completion notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="shareNotifications"
              checked={notificationSettingsObj.shareNotifications !== false}
              onChange={(e) => updateNotificationSetting('shareNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="shareNotifications">Chat sharing notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={notificationSettingsObj.emailNotifications === true}
              onChange={(e) => updateNotificationSetting('emailNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="emailNotifications">Email notifications</Label>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={!hasChanges || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : hasChanges ? (
            <div className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </div>
          ) : (
            'Saved'
          )}
        </Button>
      </div>
    </div>
  );
}