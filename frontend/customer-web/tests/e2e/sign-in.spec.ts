import { expect, test } from "@playwright/test";

/**
 * Feature 4: sign-in by one-time code. Needs the backend in development mode (OTP_DEV_MODE=true) with the
 * dummy number from .env (OTP_TEST_PHONE=9999999999, OTP_TEST_CODE=123456).
 */

test("signing in with the dummy number and signing out again", async ({ page, isMobile }) => {
  await page.goto("/categories");
  await page.locator("header").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fcategories$/);

  await page.getByRole("button", { name: "Use dummy number" }).click();
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Your code (development mode)")).toBeVisible();

  await page.getByLabel("One-time code").fill("000000");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByText(/That code is not right/)).toBeVisible();

  await page.getByLabel("One-time code").fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/categories$/);

  const account = page.locator("header").getByRole("button", { name: isMobile ? "Account" : /99999 99999/ });
  await account.click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.locator("header").getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("an invalid mobile number is explained", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Mobile number", { exact: true }).fill("12345");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Enter a valid 10-digit Indian mobile number.")).toBeVisible();
});

test("phones open the menu and navigate from it", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The menu replaces the desktop navigation on narrow screens.");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Explore events" }).click();

  await expect(page).toHaveURL(/\/categories$/);
  await expect(menu).toBeHidden();
});
