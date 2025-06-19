"use client";

import { useState } from "react";
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
import { toast } from "@/lib/toast";

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
  const [isLoading, setIsLoading] = useState(false);

  const reactHookForm = useReactHookForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpFormData) => {
    try {
      setIsLoading(true);
      const signUpResult = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (signUpResult.error) {
        throw new Error(signUpResult.error.message || "Failed to create account");
      }

      toast.success("Account created successfully! Redirecting...");
      
      // Redirect to dashboard on successful registration
      router.push("/dashboard");
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('Account Creation Failed', error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...reactHookForm}>
      <form onSubmit={reactHookForm.handleSubmit(onSubmit)} className="space-y-4">

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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
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