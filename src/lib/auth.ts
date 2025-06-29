import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // BetterAuth will automatically create and manage its own tables
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for MVP, can enable later
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
        fieldName: "avatar_url",
      },
      preferences: {
        type: "string",
        required: false,
        defaultValue: "{}",
      },
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // Add rate limiting in production
  rateLimit: {
    window: 60, // 1 minute
    max: 10, // 10 requests per minute per IP
  },
  // CSRF protection
  csrf: {
    enabled: true,
  },
  // Trusted origins for CORS
  trustedOrigins: process.env.NODE_ENV === "production"
    ? [process.env.BETTER_AUTH_URL || "https://chat.kepler.systems"]
    : ["http://localhost:3000"],
});