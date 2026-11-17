import { expect, test, type Page } from "@playwright/test";

/**
 * Venues, services, favourites and the cart, against the backend with the demo data (db/demo) and the dummy
 * sign-in number from .env. Payment itself needs Razorpay test keys and is not exercised here.
 */

async function signIn(page: Page) {
  await page.getByRole("button", { name: "Use dummy number" }).click();
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("One-time code").fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
}

test("a venue shows what its owner does not allow, first and in the source wording", async ({ page }) => {
  await page.goto("/venues/demo-garden-choultry-kukatpally");
  await expect(page.getByRole("heading", { level: 1, name: "Demo Garden Choultry" })).toBeVisible();
  const rules = page.getByRole("list").filter({ hasText: "The owner does not allow Food services" });
  await expect(rules.getByRole("listitem").first()).toContainText("The owner does not allow Food services");
  await expect(page.getByText("Demo", { exact: true }).first()).toBeVisible();
});

test("services adapt to a chosen venue and flag what it does not allow instead of hiding it", async ({ page }) => {
  await page.goto("/services?venue=demo-garden-choultry-kukatpally");
  const notice = page.getByRole("note");
  await expect(notice).toContainText("Planning at Demo Garden Choultry");
  await expect(notice).toContainText("The owner does not allow Food services");
  await expect(page.getByRole("link", { name: "Remove filter Venue: Demo Garden Choultry" })).toBeVisible();
  // The caterer is still listed, but flagged.
  const caterer = page.getByRole("article").filter({ hasText: "Wedding catering" });
  await expect(caterer).toContainText("Not allowed at your chosen venue");
});

test("venue filters narrow the results and can be cleared", async ({ page }) => {
  await page.goto("/venues?city=Bengaluru&guests=500");
  await expect(page.getByText(/^\d+ venues?$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Demo Garden Choultry" })).toHaveCount(0);
  await page.getByRole("link", { name: "Remove filter City: Bengaluru" }).click();
  await expect(page).toHaveURL(/\/venues\?guests=500$/);
});

test("signed-in customers save favourites and add packages to the cart", async ({ page, isMobile }) => {
  test.skip(isMobile, "One run is enough; the flow is the same on phones.");
  await page.goto("/vendors/demo-beats-dj");
  await page.getByRole("button", { name: "Sign in to add to cart" }).first().click();
  await signIn(page);
  await expect(page).toHaveURL(/\/vendors\/demo-beats-dj$/);

  // Favourite on, then off again (leaves the dummy account as it was).
  await page.getByRole("button", { name: /Save DJ for sangeet and reception to favourites/ }).first().click();
  const saved = page.getByRole("button", { name: /Remove DJ for sangeet and reception from favourites/ }).first();
  await expect(saved).toBeVisible();
  await saved.click();
  await expect(page.getByRole("button", { name: /Save DJ for sangeet and reception to favourites/ }).first()).toBeVisible();

  // The form explains a missing date, then adds the package.
  const pkg = page.locator("li", { has: page.getByRole("heading", { name: "DJ night, 4 hours" }) });
  await pkg.getByRole("button", { name: /Add to cart/ }).click();
  await expect(pkg.getByText("Choose your event date.")).toBeVisible();
  await pkg.getByLabel("Event date").fill("2028-01-15");
  await pkg.getByRole("button", { name: /Add to cart/ }).click();
  await expect(pkg.getByText("Added to your cart")).toBeVisible();

  await page.getByRole("link", { name: "View cart" }).click();
  const item = page.getByRole("article").filter({ hasText: "DJ night, 4 hours" }).filter({ hasText: "15 Jan 2028" });
  await expect(item).toContainText("₹22,000");
  await expect(page.getByText(/Advance now \(\d+%\)/)).toBeVisible();

  // Clean up the dummy account's cart.
  await item.getByRole("button", { name: "Remove" }).click();
  await expect(item).toHaveCount(0);
});

test("signed-out visitors are asked to sign in for the cart", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText("Sign in to see your cart")).toBeVisible();
});
