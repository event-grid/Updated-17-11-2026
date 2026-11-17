import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminLoginForm } from "@/components/AdminForms";
import { adminConfigured, isAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl bg-white p-8 ring-1 ring-line">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Administration</p>
        <h1 className="font-display text-4xl tracking-tight">Administrator sign in</h1>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-56 animate-pulse rounded-xl bg-sand" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  if (await isAdmin()) redirect("/");
  if (!adminConfigured()) {
    return (
      <p role="alert" className="rounded-lg bg-[#f8e3dd] px-4 py-3 text-sm text-terracotta-600">
        Administrator sign-in is not set up. Add ADMIN_PORTAL_EMAIL and ADMIN_PORTAL_PASSWORD to
        frontend/admin-portal/.env.local and restart the portal.
      </p>
    );
  }
  return <AdminLoginForm />;
}
