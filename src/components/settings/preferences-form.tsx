'use client';

import { useState, useEffect } from 'react';
import { Save, Palette, Globe, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { UserPreferences } from '@/lib/db/types';

export function PreferencesForm() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences({ ...preferences, [key]: value });
    setHasChanges(true);
  };

  const updateChatSetting = (key: string, value: any) => {
    if (!preferences) return;
    
    const chatSettings = { ...(preferences.chatSettings as object || {}), [key]: value };
    updatePreference('chatSettings', chatSettings);
  };

  const updateUISetting = (key: string, value: any) => {
    if (!preferences) return;
    
    const uiSettings = { ...(preferences.uiSettings as object || {}), [key]: value };
    updatePreference('uiSettings', uiSettings);
  };

  const updateNotificationSetting = (key: string, value: any) => {
    if (!preferences) return;
    
    const notificationSettings = { ...(preferences.notificationSettings as object || {}), [key]: value };
    updatePreference('notificationSettings', notificationSettings);
  };

  const savePreferences = async () => {
    if (!preferences || !hasChanges) return;

    try {
      setSaving(true);
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setHasChanges(false);
        // Apply theme change immediately
        if (preferences.theme) {
          document.documentElement.setAttribute('data-theme', preferences.theme);
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load preferences</p>
        <Button onClick={loadPreferences} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const chatSettings = (preferences.chatSettings as any) || {};
  const uiSettings = (preferences.uiSettings as any) || {};
  const notificationSettings = (preferences.notificationSettings as any) || {};

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
              value={preferences.theme || 'system'}
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
              value={uiSettings.fontSize || 'medium'}
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
              value={uiSettings.sidebarWidth || 'normal'}
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
              value={preferences.language || 'en'}
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
              value={uiSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
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
              value={preferences.defaultModel || 'gpt-4o-mini'}
              onChange={(e) => updatePreference('defaultModel', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
          </div>

          <div>
            <Label htmlFor="defaultProvider">Default Provider</Label>
            <select
              id="defaultProvider"
              value={preferences.defaultProvider || 'openai'}
              onChange={(e) => updatePreference('defaultProvider', e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={chatSettings.autoSave !== false}
                onChange={(e) => updateChatSetting('autoSave', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="autoSave">Auto-save conversations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="streamingResponses"
                checked={chatSettings.streamingResponses !== false}
                onChange={(e) => updateChatSetting('streamingResponses', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="streamingResponses">Enable streaming responses</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showTokenCount"
                checked={chatSettings.showTokenCount === true}
                onChange={(e) => updateChatSetting('showTokenCount', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showTokenCount">Show token usage</Label>
            </div>
          </div>
        </div>
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
              checked={notificationSettings.chatNotifications !== false}
              onChange={(e) => updateNotificationSetting('chatNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="chatNotifications">Chat completion notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="shareNotifications"
              checked={notificationSettings.shareNotifications !== false}
              onChange={(e) => updateNotificationSetting('shareNotifications', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="shareNotifications">Chat sharing notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={notificationSettings.emailNotifications === true}
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