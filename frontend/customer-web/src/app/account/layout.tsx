import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountNav } from "@/features/account/components/AccountNav";

export const metadata: Metadata = { title: { default: "My account", template: "%s | My account | EVENTGRID" }, robots: { index: false } };

/** Signed-in area. Pages are client components fed by the customer API; the backend decides access. */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[14rem_1fr]">
      <Suspense fallback={<div className="skeleton h-12 rounded-lg lg:h-64" aria-hidden="true" />}>
        <AccountNav />
      </Suspense>
      <Suspense fallback={<div className="skeleton h-96 rounded-xl" aria-hidden="true" />}>
        <div className="min-w-0">{children}</div>
      </Suspense>
    </div>
  );
}
