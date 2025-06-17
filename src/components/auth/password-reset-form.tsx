"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export function PasswordResetForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Notification store available for future use
  // const notify = useNotify();
  
  // Use our new form store
  const formStore = useForm('password-reset-form');
  const { form: formState, handleSubmit, setDirty } = formStore;

  const reactHookForm = useReactHookForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Mark form as dirty when values change
  reactHookForm.watch(() => {
    if (!formState.isDirty) {
      setDirty(true);
    }
  });

  const onSubmit = async (_values: PasswordResetFormData) => {
    const result = await handleSubmit(
      async () => {
        // TODO: Implement password reset with BetterAuth
        // For now, simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock success for now - in real implementation:
        // const result = await resetPassword({ email: values.email });
        
        return { success: true };
      },
      {
        successMessage: "Password reset link sent successfully!",
        showNotifications: true,
      }
    );

    if (result) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
          <p className="text-sm text-gray-600">
            We've sent a password reset link to <strong>{reactHookForm.getValues("email")}</strong>
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => {
                setIsSubmitted(false);
                formStore.clearError();
              }}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              try again
            </button>
          </p>
          
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">Reset your password</h3>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      <Form {...reactHookForm}>
        <form onSubmit={reactHookForm.handleSubmit(onSubmit)} className="space-y-4">
          {/* Enhanced error display using form store */}
          {formState.error && (
            <div className="rounded-md bg-red-50 p-3">
              <div className="text-sm text-red-700">{formState.error}</div>
            </div>
          )}

          {/* Enhanced success display using form store */}
          {formState.success && (
            <div className="rounded-md bg-green-50 p-3">
              <div className="text-sm text-green-700">{formState.success}</div>
            </div>
          )}

          <FormField
            control={reactHookForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={formState.isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={formState.isLoading}>
            {formState.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </form>
      </Form>
    </div>
  );
}