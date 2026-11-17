import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { DeleteProviderButton, EditProviderForm, ResetPasswordForm } from "@/components/ManageForms";
import { LiveSync } from "@/components/LiveSync";
import { StatusButtons } from "@/components/StatusButtons";
import { StatusBadge } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { getProviderById } from "@/lib/store";

export const metadata: Metadata = { title: "Vendor" };

export default function ProviderDetailPage(props: PageProps<"/vendors/[id]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Detail params={props.params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/vendors/[id]">, "params">) {
  if (!(await isAdmin())) redirect("/login");
  const { id } = await params;
  const provider = await getProviderById(id);
  if (!provider) notFound();

  return (
    <div className="flex flex-col gap-10">
      <LiveSync />
      <Link href="/vendors" className="text-sm text-ink-soft hover:text-terracotta">
        ← All vendors
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl tracking-tight">{provider.name}</h1>
          <StatusBadge status={provider.status} />
        </div>
        <p className="text-ink-soft">
          {provider.type === "COMPANY" ? "Business" : "Individual"} · {[provider.area, provider.city].filter(Boolean).join(", ")} ·{" "}
          {provider.email} · {provider.phone} · {provider.createdBy === "ADMIN" ? "created by admin" : "self-registered"}
        </p>
        {provider.about && <p className="max-w-3xl">{provider.about}</p>}
        <StatusButtons id={provider.id} current={provider.status} />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-3xl">Services</h2>
        {provider.services.map((s) => (
          <article key={s.key} className="flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-xl">
                {s.serviceName} <span className="text-sm text-ink-soft">· {s.categoryName}</span>
              </h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.completed ? "bg-[#e3efe6] text-[#1f5a35]" : "bg-champagne-200 text-gold"}`}>
                {s.completed ? "Completed" : "Details needed"}
              </span>
            </div>
            {s.completed ? (
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
                <dt className="text-ink-soft">Starting price</dt>
                <dd>
                  ₹{s.startingPriceRupees?.toLocaleString("en-IN")} {s.priceUnit === "PER_GUEST" ? "per guest" : "per event"}
                </dd>
                {s.options.length > 0 && (
                  <>
                    <dt className="text-ink-soft">Offers</dt>
                    <dd>{s.options.join(", ")}</dd>
                  </>
                )}
                {Object.entries(s.attributes).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-ink-soft">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
                <dt className="text-ink-soft">Description</dt>
                <dd>{s.description}</dd>
                {s.packages.length > 0 && (
                  <>
                    <dt className="text-ink-soft">Packages</dt>
                    <dd>
                      {s.packages.map((p) => `${p.name} ₹${p.priceRupees.toLocaleString("en-IN")}`).join(" · ")}
                    </dd>
                  </>
                )}
              </dl>
            ) : (
              <p className="text-sm text-ink-soft">The vendor has not filled in this service yet.</p>
            )}
          </article>
        ))}
      </section>

      <section aria-labelledby="edit-heading" className="flex flex-col gap-5">
        <h2 id="edit-heading" className="font-display text-3xl">
          Edit vendor
        </h2>
        <div className="rounded-xl bg-white p-6 ring-1 ring-line">
          <EditProviderForm
            id={provider.id}
            profile={{
              name: provider.name,
              type: provider.type,
              email: provider.email,
              phone: provider.phone,
              city: provider.city,
              area: provider.area,
              about: provider.about,
            }}
          />
        </div>
      </section>

      <section aria-labelledby="password-heading" className="flex flex-col gap-5">
        <h2 id="password-heading" className="font-display text-3xl">
          Password
        </h2>
        <div className="rounded-xl bg-white p-6 ring-1 ring-line">
          <ResetPasswordForm id={provider.id} />
        </div>
      </section>

      <section aria-labelledby="danger-heading" className="flex flex-col gap-4">
        <h2 id="danger-heading" className="font-display text-3xl">
          Delete
        </h2>
        <p className="text-ink-soft">Removes the vendor, their services and their sign-in. This cannot be undone.</p>
        <div>
          <DeleteProviderButton id={provider.id} name={provider.name} />
        </div>
      </section>
    </div>
  );
}
