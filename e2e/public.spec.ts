import { test, expect, expectNoA11yViolations } from "./fixtures";

// Public pages: reachable without a session, must paint without waiting on
// the data bootstrap (LCP fix) and pass WCAG 2.1 AA automated checks.

test.describe("public pages", () => {
  test("landing renders immediately and links to sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toHaveAttribute(
      "href",
      "/login",
    );
    await expectNoA11yViolations(page);
  });

  test("login page has labelled form fields and a main landmark", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^login$/i })).toBeEnabled();
    await expectNoA11yViolations(page);
  });

  test("register page is accessible", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("main")).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("rejects non-IUB email addresses client-side", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("someone@gmail.com");
    await page.getByLabel("Password", { exact: true }).fill("whatever123");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("protected route redirects anonymous visitors to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("robots.txt, sitemap and llms.txt are served as static files", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("User-agent: *");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("<urlset");

    const llms = await request.get("/llms.txt");
    expect(llms.ok()).toBeTruthy();
    expect(await llms.text()).toContain("# IUB Event");
  });
});
