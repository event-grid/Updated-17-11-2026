import { expect, test } from "@playwright/test";

/** Services open their listings, listings open their details, and every list can be a grid or a list. */

test("a service opens its demo listings and a listing opens its detail page", async ({ page }) => {
  await page.goto("/categories/weddings-and-reception");
  await page.locator('a[href="/categories/weddings-and-reception/photography"]').first().click();

  await expect(page).toHaveURL(/\/categories\/weddings-and-reception\/photography$/);
  await expect(page.getByRole("heading", { level: 1, name: "Photography" })).toBeVisible();
  const cards = page.locator("ul li article");
  await expect(cards).toHaveCount(6);
  await expect(cards.first().getByText("Demo", { exact: true })).toBeVisible();

  await cards.first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/photography\/d1$/);
  await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();
  await expect(page.getByText("This is a demo listing")).toBeVisible();
});

test("an unknown service or listing is not found", async ({ page }) => {
  await page.goto("/categories/weddings-and-reception/no-such-service");
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("the list switch changes how the cards are laid out", async ({ page }) => {
  await page.goto("/categories/weddings-and-reception/photography");
  const card = page.locator("ul li article").first();
  await expect(card).toBeVisible();

  const direction = () => card.evaluate((el) => getComputedStyle(el).flexDirection);
  expect(await direction()).toBe("column");
  await page.getByRole("button", { name: "List" }).click();
  expect(await direction()).toBe("row");
  await page.getByRole("button", { name: "Grid" }).click();
  expect(await direction()).toBe("column");
});

test("how it works shows the steps one under another, in order", async ({ page }) => {
  await page.goto("/how-it-works");
  const steps = page.locator("ol > li");
  await expect(steps).toHaveCount(5);
  const lefts = await steps.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  expect(new Set(lefts).size).toBe(1);
  const tops = await steps.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test("the footer social buttons are links", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Instagram", "Facebook", "YouTube", "X"]) {
    await expect(page.locator("footer").getByRole("link", { name, exact: true })).toBeVisible();
  }
});

test("every vendor listed on a service has a profile on the vendors page", async ({ page }) => {
  await page.goto("/vendors");
  await expect(page.getByText("276 vendors")).toBeVisible();

  await page.goto("/categories/weddings-and-reception/photography");
  const names = await page.locator("ul li article").evaluateAll((els) => els.map((e) => e.querySelectorAll("p")[0].textContent!.split(" · ")[0].trim()));
  expect(names).toHaveLength(6);

  await page.goto("/vendors?category=weddings-and-reception&q=photography");
  const listed = await page.locator("ul li article h3 a").allInnerTexts();
  for (const name of names) expect(listed).toContain(name);

  await page.locator("ul li article h3 a").first().click();
  await expect(page).toHaveURL(/\/vendors\/demo~weddings-and-reception~photography~d\d$/);
  await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();
  await expect(page.getByText("This is a demo vendor")).toBeVisible();
});

test("vendors can be filtered by occasion and searched", async ({ page }) => {
  await page.goto("/vendors?category=weddings-and-reception");
  await expect(page.getByText("66 vendors")).toBeVisible();
  await page.goto("/vendors?q=zzzz");
  await expect(page.getByText("No vendors match")).toBeVisible();
});
