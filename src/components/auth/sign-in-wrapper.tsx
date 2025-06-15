"use client";

import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export function SignInWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}