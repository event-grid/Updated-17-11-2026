import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "About EVENTGRID" };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About" title={<>One platform, <em className="text-terracotta">every celebration.</em></>}
      pending="Company details and the full story will be added once the owner approves the wording.">
      <p>
        EVENTGRID brings together venues and event vendors across India — choultries, banquet halls, caterers,
        photographers, decorators, makeup artists, DJs and more — so customers can plan weddings, birthdays, meetups,
        baby showers, college and corporate events in one place.
      </p>
      <p>
        Every venue shows what its owner provides, allows and does not allow, and every package has a clear price, so you can
        plan with confidence.
      </p>
    </InfoPage>
  );
}
