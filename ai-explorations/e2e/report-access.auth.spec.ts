import { type Page, test, expect } from "@playwright/test";

import { signIn } from "./helpers/auth";
import { dismissCookieConsent, presetCookieConsent } from "./helpers/cookie-consent";
import { getTestUser, getTestViewer, skipWithoutSeedSecret } from "./helpers/credentials";
import { expectHydrated } from "./helpers/hydration";
import { seedOwnReport, seedUser } from "./helpers/seed";

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

type ReportUser = { relationTo: string; value: string | Record<string, unknown> };

function getParsed(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/** Server fns answer in seroval, which keeps the returned JSON string with escaped quotes. */
function getReport(value: unknown, id: string): { user?: ReportUser } | undefined {
  if (typeof value === "string") {
    if (!value.includes(id)) return undefined;
    const parsed = getParsed(value) ?? getParsed(value.replaceAll(/\\(["\\])/g, "$1"));
    return parsed === undefined ? undefined : getReport(parsed, id);
  }
  if (!value || typeof value !== "object") return undefined;
  if ((value as { id?: unknown }).id === id) return value as { user?: ReportUser };

  for (const child of Object.values(value)) {
    const found = getReport(child, id);
    if (found) return found;
  }
  return undefined;
}

type RouterWindow = { __TSR_ROUTER__: { navigate: (options: { href: string }) => Promise<void> } };

/** A document load answers from the SSR payload; only a client navigation calls the server fn. */
async function openReportAndReadOwner(page: Page, id: string) {
  await page.goto("/en/private/my-reports");
  await expectHydrated(page.locator("header").first());

  const reportFn = page.waitForResponse(
    async (response) =>
      response.url().includes("/_serverFn/") && (await response.text()).includes(id),
  );
  await page.evaluate(
    (href) => (window as unknown as RouterWindow).__TSR_ROUTER__.navigate({ href }),
    `/en/reports/${id}`,
  );

  const report = getReport(await (await reportFn).text(), id);
  expect(report, "the report server function answered with the report").toBeDefined();
  return report?.user;
}

test("another user's report renders without the owner's private fields", async ({
  browser,
  baseURL,
  request,
}) => {
  await seedUser(request, getTestViewer());
  const reportId = await seedOwnReport(request, "Owned by the test user");

  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  await presetCookieConsent(context, baseURL!);
  const page = await context.newPage();
  await signIn(page, getTestViewer());

  const owner = await openReportAndReadOwner(page, reportId);
  await dismissCookieConsent(page);
  await expect(page.getByRole("heading", { name: "Owned by the test user", level: 2 })).toBeVisible(
    { timeout: 30_000 },
  );

  expect(owner, "the owner the viewer cannot read stays an id").toEqual({
    relationTo: "users",
    value: expect.any(String),
  });
  await expect(page.getByRole("button", { name: "Make a copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save", exact: true })).toHaveCount(0);

  const document = await page.request.get(`/en/reports/${reportId}`);
  expect(await document.text(), "the SSR payload names no owner email").not.toContain(
    getTestUser().email,
  );

  await context.close();
});

test("the owner's own report still carries the owner and saves in place", async ({
  page,
  request,
}) => {
  const reportId = await seedOwnReport(request, "Mine to edit");

  const owner = await openReportAndReadOwner(page, reportId);
  await dismissCookieConsent(page);
  await expect(page.getByRole("heading", { name: "Mine to edit", level: 2 })).toBeVisible({
    timeout: 30_000,
  });

  expect(owner?.value).toMatchObject({ email: getTestUser().email });
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Make a copy" })).toHaveCount(0);
});
