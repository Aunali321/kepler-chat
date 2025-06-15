import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function PasswordResetPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="We'll send you a link to reset your password"
    >
      <PasswordResetForm />
    </AuthLayout>
  );
}