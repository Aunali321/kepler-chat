"use client";

import { useState, useEffect } from "react";
import { useForm as useReactHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
// Note: form-store was removed in Phase 2, using react-hook-form directly
import { PasswordInput } from "../ui/password-input";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword.length < 8) {
    return false;
  }
  return true;
}, {
  message: "Password validation failed",
  path: ["newPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserProfileForm() {
  const { user } = useAuth();
  // Notification store available for future use
  // const notify = useNotify();

  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reactHookForm = useReactHookForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Populate form with user data when available
  useEffect(() => {
    if (user) {
      reactHookForm.reset({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [user, reactHookForm]);

  const onSubmit = async (values: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // Update user profile via API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      // Clear password fields after successful update
      reactHookForm.setValue("currentPassword", "");
      reactHookForm.setValue("newPassword", "");
      reactHookForm.setValue("confirmNewPassword", "");
      
      // Show success message
      // notify({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Profile update failed:', error);
      // notify({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>
          Update your personal information and change your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...reactHookForm}>
          <form onSubmit={reactHookForm.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>

              <FormField
                control={reactHookForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
              <p className="text-xs text-gray-500">
                Leave password fields empty if you don't want to change your password.
              </p>

              <FormField
                control={reactHookForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        fieldId="profile-current-password"
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reactHookForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        fieldId="profile-new-password"
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        strengthIndicator
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reactHookForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        fieldId="profile-confirm-new-password"
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating profile...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update profile
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}