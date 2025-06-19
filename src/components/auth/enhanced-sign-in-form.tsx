"use client";

import { useState } from "react";
import { useForm as useReactHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function EnhancedSignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const notify = useNotify();

  // Use our new form store
  const formStore = (() => ({ form: { isLoading: false, error: null, success: null }, handleSubmit: async (fn: any) => { try { return await fn(); } catch (error) { toast.error('Error', error instanceof Error ? error.message : 'An error occurred'); return null; } } }))('sign-in-form');
  const { form, handleSubmit, setDirty } = formStore;

  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const reactHookForm = useReactHookForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: 'onChange',
  });

  // Mark form as dirty when values change
  reactHookForm.watch(() => {
    if (!form.isDirty) {
      setDirty(true);
    }
  });

  const onSubmit = async (values: SignInFormData) => {
    const result = await handleSubmit(
      async () => {
        const signInResult = await signIn.email({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
        });

        if (signInResult.error) {
          throw new Error(signInResult.error.message || "Invalid email or password");
        }

        return signInResult;
      },
      {
        successMessage: "Welcome back! Redirecting...",
        showNotifications: true,
      }
    );

    if (result) {
      // Redirect to callback URL or dashboard
      router.push(callbackUrl);
    }
  };

  const handleGoogleSignIn = async () => {
    await notify.promise(
      signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      }),
      {
        loading: "Signing in with Google...",
        success: "Successfully signed in with Google!",
        error: (error) => `Google sign-in failed: ${error.message}`,
      }
    );
  };

  return (
    <div className="space-y-6">
      <Form {...reactHookForm}>
        <form onSubmit={reactHookForm.handleSubmit(onSubmit)} className="space-y-4">
          {/* Enhanced error display using form store */}
          {form.error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="text-sm text-red-700">{form.error}</div>
            </div>
          )}

          {/* Enhanced success display using form store */}
          {form.success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3">
              <div className="text-sm text-green-700">{form.success}</div>
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
                    {...field}
                    type="email"
                    placeholder="Enter your email"
                    disabled={form.isLoading}
                    className="transition-all duration-200"
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
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      disabled={form.isLoading}
                      className="pr-10 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={form.isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={reactHookForm.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={form.isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Remember me for 30 days
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <Link
              href="/password-reset"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full transition-all duration-200" 
            disabled={form.isLoading || !reactHookForm.formState.isValid}
          >
            {form.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={form.isLoading}
        className="w-full transition-all duration-200"
      >
        {form.isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
          Sign up
        </Link>
      </p>
    </div>
  );
}