import { expect, test } from "@playwright/test";

/** Feature 1: category browsing, against the real backend catalogue. */

test("homepage shows the 8 main categories and the 4 other categories", async ({ page }) => {
  await page.goto("/");

  const section = page.locator("#categories");
  await expect(section.getByRole("heading", { name: "What’s the occasion?" })).toBeVisible();
  await expect(section.getByRole("link", { name: /Weddings and Reception/ })).toBeVisible();
  await expect(section.getByRole("link", { name: /Venues/ })).toBeVisible();

  const other = page.getByRole("region", { name: /Other categories/ });
  for (const name of ["Surprise Events", "Corporate Events", "College and School Events", "Outdoor Events"]) {
    await expect(other.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  }
});

test("a category shows its event types and services in the source wording", async ({ page }) => {
  await page.goto("/");
  await page.locator("#categories").getByRole("link", { name: /Weddings and Reception/ }).click();

  await expect(page).toHaveURL(/\/categories\/weddings-and-reception$/);
  await expect(page.getByRole("heading", { level: 1, name: "Weddings and Reception" })).toBeVisible();
  await expect(page.getByText("Micro-Weddings")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wearables [Rental]" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Music & Dj’S" })).toBeVisible();
});

test("a category with no content says so", async ({ page }) => {
  await page.goto("/categories/surprise-events");

  await expect(page.getByRole("heading", { level: 1, name: "Surprise Events" })).toBeVisible();
  await expect(page.getByText("No event types or services are listed for this category yet.")).toBeVisible();
});

test("the planner box opens the chosen category", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: /What are you planning/ }).click();
  await page.getByRole("option", { name: "Baby Shower" }).click();
  await expect(page.getByRole("combobox", { name: /What are you planning/ })).toHaveText(/Baby Shower/);
  await page.getByRole("button", { name: /Start exploring/ }).click();

  await expect(page).toHaveURL(/\/categories\/baby-shower$/);
  await expect(page.getByRole("heading", { name: "Return Gifts (optional)" })).toBeVisible();
});

test("the planner box works with the keyboard", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard test runs on the laptop layout.");
  await page.goto("/");
  const picker = page.getByRole("combobox", { name: /What are you planning/ });
  await picker.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("p"); // jumps to Photography
  await page.keyboard.press("Enter");
  await expect(picker).toHaveText(/Photography/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("an unknown category shows the not-found page and is not indexed", async ({ page }) => {
  await page.goto("/categories/no-such-category");

  await expect(page.getByRole("heading", { name: /This celebration/ })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
});

test("pages never scroll sideways", async ({ page }) => {
  for (const path of ["/", "/categories", "/categories/weddings-and-reception", "/search?q=photo"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("the category bar is hidden on the home page and marks the current category elsewhere", async ({ page }) => {
  const bar = page.getByRole("navigation", { name: "Event categories" });

  await page.goto("/");
  await expect(bar).toHaveCount(0);

  await page.goto("/categories");
  await expect(bar.locator('[aria-current="page"]')).toHaveText("All");

  await bar.getByRole("link", { name: "Baby Shower" }).click();
  await expect(page).toHaveURL(/\/categories\/baby-shower$/);
  await expect(bar.locator('[aria-current="page"]')).toHaveText("Baby Shower");
});
