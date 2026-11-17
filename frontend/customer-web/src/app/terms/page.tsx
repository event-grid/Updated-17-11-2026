import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title="Terms and conditions"
      pending="The terms and conditions are being prepared with legal counsel (D-34) and will be published here before launch. No terms are implied until then.">
      <p>This page will set out the terms for using EVENTGRID, booking vendors and paying advances.</p>
    </InfoPage>
  );
}
