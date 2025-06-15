import { AuthLayout } from "@/components/auth/auth-layout";
import { SignInWrapper } from "@/components/auth/sign-in-wrapper";

export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your Kepler Chat account"
    >
      <SignInWrapper />
    </AuthLayout>
  );
}