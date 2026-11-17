import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { InfoPage } from "@/components/layout/InfoPage";
import { readSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="skeleton mx-auto my-16 h-64 w-full max-w-3xl rounded-xl" />}>
      <ContactContent />
    </Suspense>
  );
}

/** The contact details are set by an administrator under Site settings; until they are, the page says so. */
async function ContactContent() {
  await connection();
  const { contact } = await readSettings();
  const hasDetails = Boolean(contact.email || contact.phone || contact.address);

  return (
    <InfoPage
      eyebrow="Contact"
      title={<>Get in <em className="text-terracotta">touch.</em></>}
      pending={hasDetails ? undefined : "Official contact details (email, phone and address) have not been approved yet. They will appear here before launch."}
    >
      {hasDetails ? (
        <dl className="grid gap-5 sm:grid-cols-[8rem_1fr]">
          {contact.email && (
            <>
              <dt className="font-semibold text-ink">Email</dt>
              <dd>
                <a href={`mailto:${contact.email}`} className="underline decoration-terracotta underline-offset-4">
                  {contact.email}
                </a>
              </dd>
            </>
          )}
          {contact.phone && (
            <>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd>
                <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="underline decoration-terracotta underline-offset-4">
                  {contact.phone}
                </a>
              </dd>
            </>
          )}
          {contact.address && (
            <>
              <dt className="font-semibold text-ink">Address</dt>
              <dd className="whitespace-pre-line">{contact.address}</dd>
            </>
          )}
        </dl>
      ) : (
        <p>Until then, please use the information on the customer support page.</p>
      )}
    </InfoPage>
  );
}
