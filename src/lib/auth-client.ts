"use client";

import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === "production" 
    ? process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://your-domain.com"
    : "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Convenience hooks
export const useUser = () => {
  const session = useSession();
  return session.data?.user ?? null;
};

export const useIsAuthenticated = () => {
  const session = useSession();
  return !!session.data?.user;
};

// Type exports for convenience
export type Session = Awaited<ReturnType<typeof authClient.getSession>>;
export type User = NonNullable<Session["data"]>["user"];