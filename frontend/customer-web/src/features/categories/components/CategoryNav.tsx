import { getCategories } from "../api";

import { CategoryNavStrip } from "./CategoryNavStrip";

/** Loads the categories (cached with the catalogue) for the category strip under the header. */
export async function CategoryNav() {
  const categories = await getCategories();
  return <CategoryNavStrip categories={categories} />;
}
