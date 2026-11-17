import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/features/auth/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Sign in</h1>
      <p className="mt-3 max-w-md text-center text-ink-soft">
        Use your mobile number or email. We&apos;ll send you a one-time code — no password needed.
      </p>
      <div className="mt-10 flex w-full justify-center">
        <Suspense fallback={<div className="h-96 w-full max-w-md rounded-2xl bg-white ring-1 ring-line" />}>
          <SignInForm />
        </Suspense>
      </div>
    </section>
  );
}
