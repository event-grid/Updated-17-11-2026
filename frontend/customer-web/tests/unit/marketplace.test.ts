import { describe, expect, it } from "vitest";

import { activeFilters, parseListingQuery, parseVenueQuery, withParam } from "@/features/marketplace/search-params";
import { capacityLabel, formatDate, formatRupees, tomorrowIso, unitSuffix } from "@/lib/format";

describe("Indian formatting", () => {
  it("formats paise as rupees with Indian digit grouping", () => {
    expect(formatRupees(15_000_000)).toBe("₹1,50,000");
    expect(formatRupees(45_000)).toBe("₹450");
    expect(formatRupees(12_345_050)).toBe("₹1,23,450.50");
  });

  it("labels per-guest prices", () => {
    expect(unitSuffix("PER_GUEST")).toBe(" per guest");
    expect(unitSuffix("FIXED")).toBe("");
  });

  it("formats event dates as Indian calendar dates", () => {
    expect(formatDate("2027-02-14")).toBe("14 Feb 2027");
  });

  it("knows tomorrow in India", () => {
    // 20:00 UTC on 12 Nov is already 13 Nov in India, so tomorrow is 14 Nov.
    expect(tomorrowIso(new Date("2026-11-12T20:00:00Z"))).toBe("2026-11-14");
  });

  it("describes capacity", () => {
    expect(capacityLabel(150, 600)).toBe("150–600 guests");
    expect(capacityLabel(null, 1200)).toBe("Up to 1,200 guests");
    expect(capacityLabel(null, null)).toBeNull();
  });
});

describe("marketplace search parameters", () => {
  it("drops malformed values", () => {
    expect(parseVenueQuery({ guests: "abc", maxPrice: "-5", page: "0", city: "  Hyderabad " })).toEqual({
      q: undefined,
      city: "Hyderabad",
      type: undefined,
      guests: undefined,
      maxPrice: undefined,
      category: undefined,
      sort: undefined,
      page: undefined,
    });
  });

  it("accepts only VEG or NON_VEG as food", () => {
    expect(parseListingQuery({ food: "VEG" }).food).toBe("VEG");
    expect(parseListingQuery({ food: "fish" }).food).toBeUndefined();
  });

  it("changing a filter resets the page; removing one drops it", () => {
    const query = { city: "Hyderabad", guests: 300, page: 3 };
    expect(withParam("/venues", query, "city", "Bengaluru")).toBe("/venues?city=Bengaluru&guests=300");
    expect(withParam("/venues", query, "guests", undefined)).toBe("/venues?city=Hyderabad");
    expect(withParam("/venues", query, "page", 4)).toBe("/venues?city=Hyderabad&guests=300&page=4");
  });

  it("lists active filters as chips, without page and sort", () => {
    expect(activeFilters({ city: "Hyderabad", page: 2, sort: "price_asc" }, { city: "City" })).toEqual([
      { key: "city", label: "City: Hyderabad" },
    ]);
  });
});
