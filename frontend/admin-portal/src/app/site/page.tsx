import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SettingsForm } from "@/components/ManageForms";
import { isAdmin } from "@/lib/admin-session";
import { readSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Website settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Website settings</h1>
        <p className="max-w-2xl text-ink-soft">
          What visitors see on the EVENTGRID website. Saved changes appear on every open page within a second.
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
  return (
    <div className="max-w-3xl rounded-xl bg-white p-6 ring-1 ring-line sm:p-8">
      <SettingsForm settings={await readSettings()} />
    </div>
  );
}
