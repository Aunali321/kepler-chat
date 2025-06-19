import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { auth } from '@/lib/auth';

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirmNewPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  }
).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Current password is required to change password",
    path: ["currentPassword"],
  }
);

async function putHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile using BetterAuth
    if (validatedData.name && validatedData.name !== user.name) {
      await auth.api.updateUser({
        body: {
          name: validatedData.name,
        },
        headers: request.headers,
      });
    }

    if (validatedData.email && validatedData.email !== user.email) {
      await auth.api.updateUser({
        body: {
          email: validatedData.email,
        },
        headers: request.headers,
      });
    }

    // Handle password change
    if (validatedData.newPassword && validatedData.currentPassword) {
      await auth.api.changePassword({
        body: {
          currentPassword: validatedData.currentPassword,
          newPassword: validatedData.newPassword,
        },
        headers: request.headers,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        }, 
        { status: 400 }
      );
    }

    // Handle BetterAuth specific errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid password')) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Email already exists')) {
        return NextResponse.json(
          { error: 'Email address is already taken' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export const PUT = withErrorHandling(withAuthUser(putHandler));