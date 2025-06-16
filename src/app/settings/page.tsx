import { requireAuth } from '@/lib/auth-server';
import { PreferencesForm } from '@/components/settings/preferences-form';

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your Kepler Chat experience
        </p>
      </div>

      <PreferencesForm />
    </div>
  );
}