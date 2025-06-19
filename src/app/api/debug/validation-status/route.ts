import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error";
import { authMiddleware } from "@/lib/middleware/composed";
import { responses } from "@/lib/utils/api-response";
import { getUserProviders } from "@/lib/db/queries";
import type { User } from "@/lib/db/types";

// GET /api/debug/validation-status - Debug endpoint to check validation status
async function getHandler(request: NextRequest, user: User) {
  const providers = await getUserProviders(user.id);

  console.log("=== VALIDATION STATUS DEBUG ENDPOINT ===");
  console.log(`User ID: ${user.id}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Total providers: ${providers.length}`);

  const debugData = providers.map((provider, index) => {
    const timeSinceValidation = provider.lastValidated
      ? Date.now() - new Date(provider.lastValidated).getTime()
      : null;

    const data = {
      index: index + 1,
      id: provider.id,
      provider: provider.provider,
      validationStatus: provider.validationStatus,
      isEnabled: provider.isEnabled,
      hasApiKey: !!provider.encryptedApiKey,
      lastValidated: provider.lastValidated,
      timeSinceLastValidation: timeSinceValidation
        ? {
            milliseconds: timeSinceValidation,
            minutes: Math.round(timeSinceValidation / (1000 * 60)),
            hours: Math.round(timeSinceValidation / (1000 * 60 * 60)),
            days: Math.round(timeSinceValidation / (1000 * 60 * 60 * 24)),
          }
        : null,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      settings: provider.settings,
      defaultModel: provider.defaultModel,
    };

    console.log(`\nProvider ${index + 1} (${provider.provider}):`);
    console.log(`  Status: ${provider.validationStatus}`);
    console.log(`  Has Key: ${!!provider.encryptedApiKey}`);
    console.log(`  Last Validated: ${provider.lastValidated || "Never"}`);
    if (timeSinceValidation) {
      console.log(
        `  Time Since Validation: ${Math.round(
          timeSinceValidation / (1000 * 60)
        )} minutes`
      );
    }

    return data;
  });

  // Identify potential issues
  const issues = [];
  const pendingProviders = providers.filter(
    (p) => p.validationStatus === "pending"
  );
  const invalidProviders = providers.filter(
    (p) => p.validationStatus === "invalid"
  );
  const providersWithKeysButNeverValidated = providers.filter(
    (p) => p.encryptedApiKey && !p.lastValidated
  );
  const oldValidations = providers.filter(
    (p) =>
      p.lastValidated &&
      Date.now() - new Date(p.lastValidated).getTime() > 24 * 60 * 60 * 1000
  );

  if (pendingProviders.length > 0) {
    issues.push(
      `${pendingProviders.length} provider(s) stuck in 'pending' status`
    );
  }
  if (invalidProviders.length > 0) {
    issues.push(`${invalidProviders.length} provider(s) marked as 'invalid'`);
  }
  if (providersWithKeysButNeverValidated.length > 0) {
    issues.push(
      `${providersWithKeysButNeverValidated.length} provider(s) have API keys but were never validated`
    );
  }
  if (oldValidations.length > 0) {
    issues.push(
      `${oldValidations.length} provider(s) haven't been validated in over 24 hours`
    );
  }

  const summary = {
    totalProviders: providers.length,
    byStatus: {
      pending: pendingProviders.length,
      valid: providers.filter((p) => p.validationStatus === "valid").length,
      invalid: invalidProviders.length,
    },
    withApiKeys: providers.filter((p) => p.encryptedApiKey).length,
    withoutApiKeys: providers.filter((p) => !p.encryptedApiKey).length,
    enabled: providers.filter((p) => p.isEnabled).length,
    disabled: providers.filter((p) => !p.isEnabled).length,
    issues: issues,
  };

  console.log("\nSummary:");
  console.log(`  Total: ${summary.totalProviders}`);
  console.log(`  Pending: ${summary.byStatus.pending}`);
  console.log(`  Valid: ${summary.byStatus.valid}`);
  console.log(`  Invalid: ${summary.byStatus.invalid}`);
  console.log(`  Issues found: ${issues.length}`);
  issues.forEach((issue) => console.log(`    - ${issue}`));
  console.log("=== END DEBUG ===\n");

  return responses.ok({
    timestamp: new Date().toISOString(),
    userId: user.id,
    summary,
    providers: debugData,
    issues,
  });
}

export const GET = withErrorHandling(authMiddleware.only(getHandler));
