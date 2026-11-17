import { expect, test } from "@playwright/test";

/** Feature 2: search, against the real backend index. */

test("searching from the header finds a service by its option", async ({ page, isMobile }) => {
  test.skip(isMobile, "The header search box is shown from tablet width; phones use the search page.");
  await page.goto("/");

  const box = page.getByRole("searchbox", { name: "Search events and services" });
  await box.fill("mehandi");
  await box.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=mehandi$/);
  await expect(page.getByRole("heading", { level: 1, name: /Results for/ })).toBeVisible();
  const services = page.getByRole("region", { name: "Services" });
  await expect(services.getByRole("link", { name: /Makeup[\s\S]*in Weddings and Reception/ })).toBeVisible();
  await expect(services.locator("mark", { hasText: "mehandi" })).toBeVisible();
});

test("phones reach search through the header icon", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phone layout only.");
  await page.goto("/");
  await page.locator("header").getByRole("link", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole("searchbox", { name: "Search events and services" })).toBeFocused();
});

test("results are grouped, categories first", async ({ page }) => {
  await page.goto("/search?q=photo");

  await expect(page.getByText("8 results")).toBeVisible();
  const headings = page.locator("main").getByRole("heading", { level: 2 });
  await expect(headings).toHaveText(["Categories", "Event types & subcategories", "Services"]);
});

test("a result opens its category", async ({ page }) => {
  await page.goto("/search?q=destination%20weddings");
  await page.getByRole("link", { name: /Destination Weddings/ }).click();

  await expect(page).toHaveURL(/\/categories\/weddings-and-reception$/);
});

test("no matches offers a way back to browsing", async ({ page }) => {
  await page.goto("/search?q=zzzz");

  await expect(page.getByText(/No matches for/)).toBeVisible();
  await page.getByRole("link", { name: /Browse event categories/ }).click();
  await expect(page).toHaveURL(/\/categories$/);
});

test("a query the backend rejects shows its message", async ({ page }) => {
  await page.goto("/search?q=%21%21");

  await expect(page.getByText("Enter a word of at least 2 letters or numbers.")).toBeVisible();
});
