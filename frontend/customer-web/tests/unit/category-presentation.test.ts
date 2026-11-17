import { describe, expect, it } from "vitest";

import { categoryPresentation } from "@/config/category-presentation";

/** The 12 category slugs seeded by the backend (V2026_11_11_2__catalog_seed_taxonomy.sql). */
const SEEDED_SLUGS = [
  "weddings-and-reception",
  "meetups-and-gatherings",
  "birthday-parties",
  "surprise-events",
  "photography",
  "food-and-catering",
  "baby-shower",
  "event-managers",
  "corporate-events",
  "college-and-school-events",
  "outdoor-events",
  "venues",
];

describe("categoryPresentation", () => {
  it("has a specific icon and tagline for every seeded category", () => {
    for (const slug of SEEDED_SLUGS) {
      const p = categoryPresentation(slug);
      expect(p.icon, slug).not.toBe("sparkle");
      expect(p.tagline.length, slug).toBeGreaterThan(0);
    }
  });

  it("groups exactly surprise, corporate, college and outdoor events under Other categories", () => {
    const other = SEEDED_SLUGS.filter((s) => categoryPresentation(s).group === "other");
    expect(other.sort()).toEqual(
      ["college-and-school-events", "corporate-events", "outdoor-events", "surprise-events"],
    );
  });

  it("shows a category the backend adds later as a featured tile with a neutral icon", () => {
    const p = categoryPresentation("garden-parties");
    expect(p.group).toBe("featured");
    expect(p.icon).toBe("sparkle");
  });
});
