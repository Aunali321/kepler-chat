import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Get the current user on the server side
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Require authentication - redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/sign-in");
  }
  
  return {
    user: session.user,
    session,
  };
}

/**
 * Require authentication for API routes - returns 401 if not authenticated
 */
export async function requireAuthApi() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session?.user) {
    return {
      error: "Unauthorized",
      status: 401,
    } as const;
  }
  
  return {
    user: session.user,
    session,
  } as const;
}

/**
 * Check if user is authenticated without redirecting
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get user ID from session
 */
export async function getUserId() {
  const session = await getSession();
  return session?.user?.id ?? null;
}