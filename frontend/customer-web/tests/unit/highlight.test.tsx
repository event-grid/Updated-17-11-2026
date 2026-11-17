import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Highlight, matchesAny } from "@/features/search/components/Highlight";

const render = (text: string, words: string[]) => renderToStaticMarkup(<Highlight text={text} words={words} />);
const marks = (html: string) => [...html.matchAll(/<mark[^>]*>(.*?)<\/mark>/g)].map((m) => m[1]);

describe("Highlight", () => {
  it("marks the start of words that begin with a search word, ignoring case", () => {
    expect(marks(render("Micro-Weddings", ["wed"]))).toEqual(["Wed"]);
    expect(marks(render("Weddings and Reception", ["wed", "rec"]))).toEqual(["Wed", "Rec"]);
  });

  it("does not mark matches inside a word", () => {
    expect(marks(render("Photography", ["graph"]))).toEqual([]);
  });

  it("prefers the longest word when search words overlap", () => {
    expect(marks(render("Photographers", ["photo", "photographers"]))).toEqual(["Photographers"]);
  });

  it("works for Indian scripts with vowel signs", () => {
    expect(marks(render("शादी समारोह", ["शादी"]))).toEqual(["शादी"]);
  });

  it("treats regular-expression characters in search words literally", () => {
    expect(() => render("Music & Dj’S", ["(dj"])).not.toThrow();
    expect(marks(render("a.b test", ["a.b"]))).toEqual(["a.b"]);
  });

  it("returns the text unchanged when there are no words", () => {
    expect(render("Venues", [])).toBe("Venues");
  });
});

describe("matchesAny", () => {
  it("is true when any word of the text starts with a search word", () => {
    expect(matchesAny("mehandi artist", ["mehandi"])).toBe(true);
    expect(matchesAny("hair stylist", ["sty"])).toBe(true);
  });

  it("is false for matches inside words and for unrelated text", () => {
    expect(matchesAny("makeup", ["keup"])).toBe(false);
    expect(matchesAny("Veg", ["photo"])).toBe(false);
  });

  it("splits on punctuation such as hyphens and brackets", () => {
    expect(matchesAny("Veg and Non-Veg(same/diff vendors)", ["diff"])).toBe(true);
  });
});
