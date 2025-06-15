"use client";

import { useSession } from "@/lib/auth-client";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // BetterAuth provides session management out of the box
  return <>{children}</>;
}

// Export hooks for convenience - these use BetterAuth's built-in session management
export const useAuth = () => {
  const session = useSession();
  
  return {
    user: session.data?.user ?? null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    session: session.data,
  };
};