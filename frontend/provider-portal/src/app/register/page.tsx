import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { RegisterForm } from "@/components/AuthForms";
import { CommissionNotice } from "@/components/CommissionNotice";
import { loadCatalogue } from "@/lib/catalogue";
import { loadCommissionPercent } from "@/lib/commission";
import { currentProvider } from "@/lib/session";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-xl bg-white p-6 ring-1 ring-line sm:p-10">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Partners</p>
        <h1 className="font-display text-4xl tracking-tight">Register as a vendor</h1>
        <p className="max-w-2xl text-ink-soft">Three short steps. An administrator approves new registrations; after that you can sign in and fill in the details of each service.</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  if (await currentProvider()) redirect("/dashboard");
  const [catalogue, percent] = await Promise.all([loadCatalogue(), loadCommissionPercent()]);
  return (
    <>
      <CommissionNotice percent={percent} />
      <RegisterForm catalogue={catalogue} />
    </>
  );
}
