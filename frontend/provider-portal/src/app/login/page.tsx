import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/AuthForms";
import { currentProvider } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl bg-white p-8 ring-1 ring-line">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Partners</p>
        <h1 className="font-display text-4xl tracking-tight">Vendor sign in</h1>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse rounded-xl bg-sand" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  if (await currentProvider()) redirect("/dashboard");
  return <LoginForm />;
}
