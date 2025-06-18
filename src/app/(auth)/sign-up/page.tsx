import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Get started with Kepler Chat today"
    >
      <SignUpForm />
    </AuthLayout>
  );
}
