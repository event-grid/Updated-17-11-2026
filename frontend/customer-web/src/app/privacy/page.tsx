import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy policy"
      pending="The privacy policy is being prepared under the Digital Personal Data Protection Act, 2023 (D-34) and will be published here before launch.">
      <p>
        In short, today: EVENTGRID stores your mobile number or email to sign you in, and your cart, favourites and bookings to
        run your account. Payment details are handled by Razorpay and never stored by EVENTGRID.
      </p>
    </InfoPage>
  );
}
