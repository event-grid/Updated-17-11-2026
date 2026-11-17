import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CreateProviderForm } from "@/components/AdminForms";
import { isAdmin } from "@/lib/admin-session";
import { loadCatalogue } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Add vendor" };

export default function NewProviderPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl tracking-tight">Add a vendor</h1>
        <p className="max-w-2xl text-ink-soft">
          Create an account for a vendor and choose their services. They sign in at the partner portal with the
          temporary password and fill in the details of each service.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  if (!(await isAdmin())) redirect("/login");
  return <CreateProviderForm catalogue={await loadCatalogue()} />;
}
