import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Customer support" };

export default function SupportPage() {
  return (
    <InfoPage eyebrow="Customer support" title={<>We&apos;re here to <em className="text-terracotta">help.</em></>}
      pending="Support channels and hours are not decided yet (D-32). They will be published here before launch.">
      <h2>Your bookings</h2>
      <p>
        Your bookings, payments and their status are always in{" "}
        <Link href="/account/bookings" className="font-medium text-ink underline decoration-terracotta underline-offset-4">My account</Link>.
        A booking that is waiting for payment can be paid from its page.
      </p>
      <h2>Payments</h2>
      <p>
        Payments are processed by Razorpay. A booking changes to &quot;Advance paid&quot; only after EVENTGRID has verified the
        payment with Razorpay. If money left your account but the booking still shows &quot;Awaiting payment&quot;, wait a few
        minutes and refresh — confirmations can arrive a little later.
      </p>
    </InfoPage>
  );
}
