import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Demo-mode accounts (src/app/services/authService.ts DEMO_CREDENTIALS). */
export const DEMO = {
  student: { email: "anika.rahman@iub.edu.bd", password: "Student@12345", home: "/dashboard" },
  coordinator: { email: "coordinator@iub.edu.bd", password: "Coord@12345", home: "/coordinator" },
  clubAdmin: { email: "shoikat.azad@iub.edu.bd", password: "Club@12345", home: "/admin/dashboard" },
  superAdmin: { email: "admin@iub.edu.bd", password: "Admin@12345", home: "/superadmin" },
} as const;

export async function login(page: Page, who: keyof typeof DEMO) {
  const { email, password, home } = DEMO[who];
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL(`**${home}`);
}

/**
 * Client-side navigation. Demo mode has no persisted session, so a full
 * `page.goto()` after login would reload the app and land on /login; this
 * drives React Router through the history API instead, exactly like a
 * pasted-in URL would once Firebase Auth restores the session.
 */
export async function navigateInApp(page: Page, path: string) {
  await page.evaluate((p) => {
    window.history.pushState({}, "", p);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

/**
 * WCAG 2.1 A/AA scan of the current page. Fails the test on any violation
 * and prints a compact summary so the offending selector is visible in CI.
 */
export async function expectNoA11yViolations(page: Page, disableRules: string[] = []) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // Sonner's transient toasts use the library's own rich-colour theme; the
    // demo-mode banner would otherwise fail every page on colour contrast.
    .exclude("[data-sonner-toaster]")
    .disableRules(disableRules)
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.impact ?? "n/a"} ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join("\n    ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

export const test = base;
export { expect };
