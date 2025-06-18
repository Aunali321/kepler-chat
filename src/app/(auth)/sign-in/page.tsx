import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleSignInForm } from "@/components/auth/google-sign-in-form";

export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your Kepler Chat account"
    >
      <GoogleSignInForm />
    </AuthLayout>
  );
}
