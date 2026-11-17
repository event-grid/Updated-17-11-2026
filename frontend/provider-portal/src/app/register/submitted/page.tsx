import type { Metadata } from "next";
import Link from "next/link";

import { customerSiteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Registration received" };

export default function RegistrationSubmittedPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-xl bg-white p-8 ring-1 ring-line sm:p-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Partners</p>
        <h1 className="font-display text-4xl tracking-tight">Registration received</h1>
      </div>
      <p className="text-ink-soft">
        Thank you for registering. An EVENTGRID administrator will review your account. Once it is approved you can sign
        in, fill in the details of your services and appear to customers.
      </p>
      <p className="rounded-lg bg-champagne-200/60 px-4 py-3 text-sm text-ink">
        You cannot sign in until your registration is approved. If you try earlier you will see that it is waiting.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/login" className="rounded-md bg-terracotta px-6 py-3 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]">
          Go to sign in
        </Link>
        {customerSiteUrl && (
          <a href={customerSiteUrl} className="rounded-md px-6 py-3 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Back to EVENTGRID
          </a>
        )}
      </div>
    </div>
  );
}
