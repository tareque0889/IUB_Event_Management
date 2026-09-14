import { test, expect, login, navigateInApp, expectNoA11yViolations, DEMO } from "./fixtures";

// Authenticated flows in demo mode (seeded data, no Firebase).
// Navigation after login goes through the sidebar / history API: demo mode
// has no persisted session, so a hard reload would drop back to /login.

test.describe("student journey", () => {
  test("logs in and lands on the student dashboard", async ({ page }) => {
    await login(page, "student");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("searches the event feed with a debounced input", async ({ page }) => {
    await login(page, "student");
    await page.getByRole("link", { name: "Events" }).first().click();
    await expect(page).toHaveURL(/\/events$/);

    const search = page.getByPlaceholder("Search events...");
    await expect(search).toBeVisible();
    const cards = page.locator("[data-slot='card']");
    const before = await cards.count();
    expect(before).toBeGreaterThan(0);

    await search.fill("zzzz-no-such-event");
    // 250 ms debounce → wait for the list to settle instead of a fixed sleep.
    await expect.poll(async () => cards.count(), { timeout: 3_000 }).toBeLessThan(before);

    await search.fill("");
    await expect.poll(async () => cards.count(), { timeout: 3_000 }).toBe(before);
    await expectNoA11yViolations(page);
  });

  test("registers for an event and sees the registered state", async ({ page }) => {
    await login(page, "student");
    await page.getByRole("link", { name: "Events" }).first().click();
    await expect(page).toHaveURL(/\/events$/);

    // Seed data mixes past, full and open events; open the first card whose
    // detail page still offers registration.
    const cards = page.getByRole("link", { name: /view event$/ });
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();
    let registerButton = page.getByRole("button", { name: /register now/i });
    for (let i = 0; i < total; i++) {
      await cards.nth(i).click();
      await expect(page).toHaveURL(/\/events\/[^/]+$/);
      if (await registerButton.waitFor({ state: "visible", timeout: 1_500 }).then(() => true, () => false)) break;
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/events$/);
    }
    await expect(registerButton).toBeVisible();
    await registerButton.click();
    await expect(page).toHaveURL(/\/events\/[^/]+\/register$/);
    await expectNoA11yViolations(page);

    // Name and email are prefilled from the profile; phone is mandatory.
    await page.getByLabel("Phone Number").fill("01700000000");
    await page.getByRole("button", { name: /confirm registration/i }).click();
    await expect(page).toHaveURL(/\/events\/[^/]+$/);
    await expect(page.getByText(/registered|waitlisted/i).first()).toBeVisible();
  });

  test("club directory lists clubs and is accessible", async ({ page }) => {
    await login(page, "student");
    await page.getByRole("link", { name: "Clubs" }).first().click();
    await expect(page).toHaveURL(/\/clubs$/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(await page.locator("[data-slot='card']").count()).toBeGreaterThan(0);
    await expectNoA11yViolations(page);
  });
});

test.describe("role routing", () => {
  for (const who of ["coordinator", "clubAdmin", "superAdmin"] as const) {
    test(`${who} lands on ${DEMO[who].home} and is bounced from student-only routes`, async ({ page }) => {
      await login(page, who);
      await expect(page).toHaveURL(new RegExp(`${DEMO[who].home}$`));
      await expectNoA11yViolations(page);

      // /clubs/:id/apply is student-only → ProtectedRoute sends the user home.
      await navigateInApp(page, "/clubs/club_1/apply");
      await expect(page).toHaveURL(new RegExp(`${DEMO[who].home}$`));
    });
  }

  test("student cannot reach the super admin console", async ({ page }) => {
    await login(page, "student");
    await navigateInApp(page, "/superadmin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
