"use client";

import { useForm as useReactHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { useForm } from "@/lib/stores/form-store";
// import { useNotify } from "@/lib/stores/notification-store";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  // Notification store available for future use
  // const notify = useNotify();
  
  // Use our new form store
  const formStore = useForm('sign-up-form');
  const { form: formState, handleSubmit, setDirty } = formStore;

  const reactHookForm = useReactHookForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Mark form as dirty when values change
  reactHookForm.watch(() => {
    if (!formState.isDirty) {
      setDirty(true);
    }
  });

  const onSubmit = async (values: SignUpFormData) => {
    const result = await handleSubmit(
      async () => {
        const signUpResult = await signUp.email({
          email: values.email,
          password: values.password,
          name: values.name,
        });

        if (signUpResult.error) {
          throw new Error(signUpResult.error.message || "Failed to create account");
        }

        return signUpResult;
      },
      {
        successMessage: "Account created successfully! Redirecting...",
        showNotifications: true,
      }
    );

    if (result) {
      // Redirect to dashboard on successful registration
      router.push("/dashboard");
    }
  };

  return (
    <Form {...reactHookForm}>
      <form onSubmit={reactHookForm.handleSubmit(onSubmit)} className="space-y-4">
        {/* Enhanced error display using form store */}
        {formState.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <div className="text-sm text-red-700">{formState.error}</div>
          </div>
        )}

        {/* Enhanced success display using form store */}
        {formState.success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3">
            <div className="text-sm text-green-700">{formState.success}</div>
          </div>
        )}

        <FormField
          control={reactHookForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={formState.isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={reactHookForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  fieldId="signup-password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={formState.isLoading}
                  strengthIndicator
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={reactHookForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  fieldId="signup-confirm-password"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={formState.isLoading}
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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account?</span>{" "}
          <Link
            href="/sign-in"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}