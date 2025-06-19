import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error";
import { authMiddleware } from "@/lib/middleware/composed";
import { responses } from "@/lib/utils/api-response";
import { getUserProviders, updateUserProvider } from "@/lib/db/queries";
import { validateApiKey } from "@/lib/api-keys";
import { decryptApiKey } from "@/lib/crypto";
import type { User } from "@/lib/db/types";

// POST /api/debug/fix-validation-status - Re-validate all pending API keys
async function postHandler(request: NextRequest, user: User) {
  const providers = await getUserProviders(user.id);

  console.log("=== FIXING VALIDATION STATUS ===");
  console.log(`User ID: ${user.id}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Total providers: ${providers.length}`);

  const results = [];

  for (const provider of providers) {
    console.log(`\nProcessing ${provider.provider}:`);
    console.log(`  Current status: ${provider.validationStatus}`);
    console.log(`  Has API key: ${!!provider.encryptedApiKey}`);

    if (!provider.encryptedApiKey) {
      console.log(`  Skipping - no API key`);
      results.push({
        provider: provider.provider,
        action: "skipped",
        reason: "No API key provided",
        status: provider.validationStatus,
      });
      continue;
    }

    try {
      // Decrypt and validate the API key
      const decryptedKey = decryptApiKey(provider.encryptedApiKey);
      const validation = await validateApiKey(
        provider.provider as any,
        decryptedKey
      );

      console.log(
        `  Validation result: ${validation.isValid ? "VALID" : "INVALID"}`
      );

      const newStatus = validation.isValid ? "valid" : "invalid";

      if (provider.validationStatus !== newStatus) {
        console.log(
          `  Updating status: ${provider.validationStatus} -> ${newStatus}`
        );

        await updateUserProvider(user.id, provider.provider as any, {
          validationStatus: newStatus,
          lastValidated: new Date(),
        });

        results.push({
          provider: provider.provider,
          action: "updated",
          oldStatus: provider.validationStatus,
          newStatus: newStatus,
          reason: validation.isValid
            ? "API key is valid"
            : "API key validation failed",
        });
      } else {
        console.log(`  Status unchanged: ${provider.validationStatus}`);

        // Still update lastValidated timestamp
        await updateUserProvider(user.id, provider.provider as any, {
          lastValidated: new Date(),
        });

        results.push({
          provider: provider.provider,
          action: "refreshed",
          status: provider.validationStatus,
          reason: "Status unchanged, but refreshed validation timestamp",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.log(`  Error validating: ${errorMessage}`);

      // Mark as invalid if validation failed
      await updateUserProvider(user.id, provider.provider as any, {
        validationStatus: "invalid",
        lastValidated: new Date(),
      });

      results.push({
        provider: provider.provider,
        action: "error",
        oldStatus: provider.validationStatus,
        newStatus: "invalid",
        reason: `Validation error: ${errorMessage}`,
      });
    }
  }

  const summary = {
    total: providers.length,
    updated: results.filter((r) => r.action === "updated").length,
    refreshed: results.filter((r) => r.action === "refreshed").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    errors: results.filter((r) => r.action === "error").length,
  };

  console.log("\nSummary:");
  console.log(`  Total processed: ${summary.total}`);
  console.log(`  Updated: ${summary.updated}`);
  console.log(`  Refreshed: ${summary.refreshed}`);
  console.log(`  Skipped: ${summary.skipped}`);
  console.log(`  Errors: ${summary.errors}`);
  console.log("=== END FIX ===\n");

  return responses.ok({
    timestamp: new Date().toISOString(),
    userId: user.id,
    summary,
    results,
  });
}

export const POST = withErrorHandling(authMiddleware.only(postHandler));
