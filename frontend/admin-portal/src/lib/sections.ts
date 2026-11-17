/** The website pages an administrator can switch off. Plain data, safe to use in the browser. */
export const SECTION_KEYS = ["venues", "services", "vendors", "howItWorks"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  venues: "Venues",
  services: "Services",
  vendors: "Vendors",
  howItWorks: "How it works",
};
