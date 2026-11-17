import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Cancellation information" };

export default function CancellationPolicyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Cancellation information"
      pending="Cancellation, rescheduling and refund rules are not decided yet (D-25). They will be published here before launch; no rule is implied until then.">
      <p>
        Until the rules are published, please contact support about any change to a booking. Your booking page shows what you
        have paid.
      </p>
    </InfoPage>
  );
}
