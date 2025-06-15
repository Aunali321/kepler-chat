import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { users, sessions } from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for MVP, can enable later
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
    ? [process.env.BETTER_AUTH_URL || "https://your-domain.com"]
    : ["http://localhost:3000"],
});