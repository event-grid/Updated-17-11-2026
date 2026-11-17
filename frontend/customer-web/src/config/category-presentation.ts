/**
 * How each event category is presented on customer-web: group, tile colour, icon and tagline.
 * Presentation only — category names and contents come from the backend catalogue.
 * Taglines are marketing placeholders (content decision U-25); change them freely here.
 */

import type { CategoryIconName } from "@/components/icons/CategoryIcon";

export type CategoryGroup = "featured" | "other";

type Tile = {
  /** Tile background. */
  bg: string;
  /** Icon colour (a deeper shade of the tile). */
  icon: string;
};

const TILES = {
  rose: { bg: "bg-tile-rose", icon: "text-[#9a6b56]" },
  sage: { bg: "bg-tile-sage", icon: "text-[#6f7d68]" },
  butter: { bg: "bg-tile-butter", icon: "text-[#9a8746]" },
  blush: { bg: "bg-tile-blush", icon: "text-[#b9625a]" },
  mist: { bg: "bg-tile-mist", icon: "text-[#66757f]" },
  lilac: { bg: "bg-tile-lilac", icon: "text-[#7c5f86]" },
  mint: { bg: "bg-tile-mint", icon: "text-[#5c8a6e]" },
  peach: { bg: "bg-tile-peach", icon: "text-[#ad7448]" },
} satisfies Record<string, Tile>;

type Presentation = {
  group: CategoryGroup;
  tile: Tile;
  icon: CategoryIconName;
  tagline: string;
};

const PRESENTATION: Record<string, Presentation> = {
  "weddings-and-reception": { group: "featured", tile: TILES.rose, icon: "rings", tagline: "Vows, venues and every detail" },
  "meetups-and-gatherings": { group: "featured", tile: TILES.sage, icon: "people", tagline: "Reunions worth the wait" },
  "birthday-parties": { group: "featured", tile: TILES.butter, icon: "cake", tagline: "Cake, candles and good company" },
  photography: { group: "featured", tile: TILES.mist, icon: "camera", tagline: "Keep every moment" },
  "food-and-catering": { group: "featured", tile: TILES.blush, icon: "cloche", tagline: "Menus that bring people together" },
  "baby-shower": { group: "featured", tile: TILES.lilac, icon: "pram", tagline: "Welcome the little one" },
  "event-managers": { group: "featured", tile: TILES.mint, icon: "clipboard", tagline: "Hand the planning to the pros" },
  venues: { group: "featured", tile: TILES.peach, icon: "venue", tagline: "Find the right room" },
  // Grouped under "Other categories".
  "surprise-events": { group: "other", tile: TILES.lilac, icon: "gift", tagline: "Plan it quietly" },
  "corporate-events": { group: "other", tile: TILES.mist, icon: "briefcase", tagline: "Events that work" },
  "college-and-school-events": { group: "other", tile: TILES.butter, icon: "cap", tagline: "Campus moments, big and small" },
  "outdoor-events": { group: "other", tile: TILES.sage, icon: "tent", tagline: "Celebrate under open skies" },
};

/** Categories the backend adds later still render, with a neutral tile. */
const FALLBACK: Presentation = { group: "featured", tile: TILES.peach, icon: "sparkle", tagline: "Explore what's on offer" };

export function categoryPresentation(slug: string): Presentation {
  return PRESENTATION[slug] ?? FALLBACK;
}
