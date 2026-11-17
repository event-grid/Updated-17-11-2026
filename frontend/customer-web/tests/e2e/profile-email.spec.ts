import { expect, test } from "@playwright/test";

/**
 * Adding or changing the email address on the profile, confirmed with a one-time code. Needs the backend in
 * development mode (OTP_DEV_MODE=true) with the dummy number from .env (OTP_TEST_PHONE=9999999999, OTP_TEST_CODE=123456).
 * The code for the email address is shown on screen in development mode.
 */

async function signInWithDummyNumber(page: import("@playwright/test").Page) {
  await page.goto("/sign-in?next=%2Faccount%2Fprofile");
  await page.getByRole("button", { name: "Use dummy number" }).click();
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("One-time code").fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);
}

test("an email address is saved only after its code is confirmed", async ({ page }) => {
  await signInWithDummyNumber(page);
  const email = `e2e${Date.now()}@example.com`;

  await page.getByRole("button", { name: /Add email|Change email/ }).click();
  await page.getByRole("textbox", { name: /email address/i }).fill("not-an-email");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.getByRole("textbox", { name: /email address/i }).fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText(/We sent a code to/)).toBeVisible();
  const shown = await page.getByText("Development mode: your code is").innerText();
  const code = /(\d{6})/.exec(shown)?.[1];
  expect(code).toBeTruthy();

  await page.locator("#email-code").fill("000000");
  await page.getByRole("button", { name: "Verify and save" }).click();
  await expect(page.getByText(/That code is not right/)).toBeVisible();

  await page.locator("#email-code").fill(code!);
  await page.getByRole("button", { name: "Verify and save" }).click();
  await expect(page.getByText("Email verified and saved")).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Kept on the account: still there after a reload.
  await page.reload();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Verified", { exact: true })).toBeVisible();
});
