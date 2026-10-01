import { type APIRequestContext, type Browser, test, expect, request } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";
import { indicatorRow, infoButton } from "./helpers/indicators";

// The info panel lives on /reports/indicators, which is gated, so this runs signed in, in
// `chromium-authenticated`. The CMS half signs in separately as an admin.
test.skip(skipWithoutCredentials, "E2E test user credentials not set");

const INDICATOR = { id: 7, name: "Slope" };
const API = "/v1/api";

const adminCredentials = () => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set");

  return { email, password };
};

/**
 * A browser context with no app session in it. A NextAuth cookie next to the admin's makes
 * every CMS write fail with 403, so the admin never shares the signed-in user's storage.
 */
const adminContext = (browser: Browser, baseURL: string | undefined) =>
  browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });

async function adminApi(baseURL: string | undefined): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL });
  const { email, password } = adminCredentials();

  const seedSecret = process.env.E2E_SEED_SECRET;
  if (seedSecret) {
    const seeded = await api.post("/local-api/e2e/seed-admin", {
      data: { email, password, secret: seedSecret },
    });
    if (!seeded.ok()) {
      throw new Error(`Seed endpoint returned ${seeded.status()}: ${await seeded.text()}`);
    }
  }

  const login = await api.post(`${API}/admins/login`, { data: { email, password } });
  if (!login.ok()) throw new Error(`Admin login returned ${login.status()}`);
  const { token } = (await login.json()) as { token: string };

  await api.dispose();
  return request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `JWT ${token}` } });
}

test.describe("editing an indicator description in the CMS", () => {
  let api: APIRequestContext;
  let original: string;

  test.beforeAll(async ({ baseURL }) => {
    api = await adminApi(baseURL);
    const response = await api.get(`${API}/indicators/${INDICATOR.id}?locale=en&depth=0`);
    original = ((await response.json()) as { description: string }).description;
  });

  test.afterAll(async () => {
    // Put the seeded text back, published, so the next spec and the next run read the catalogue
    // as the seed left it.
    await api.patch(`${API}/indicators/${INDICATOR.id}?locale=en`, {
      data: { description: original, _status: "published" },
    });
    await api.dispose();
  });

  test("saves Markdown that the info panel renders", async ({ browser, baseURL, page }) => {
    const { email, password } = adminCredentials();
    const admin = await adminContext(browser, baseURL);
    const cms = await admin.newPage();

    await cms.goto("/admin/login");
    await cms.getByLabel("Email").fill(email);
    await cms.getByLabel("Password").fill(password);
    await cms.getByRole("button", { name: "Login" }).click();
    await expect(cms).toHaveURL(/\/admin$/);

    await cms.goto(`/admin/collections/indicators/${INDICATOR.id}?locale=en`);
    const editor = cms.locator(".markdown-field [contenteditable='true']");
    await expect(editor).toContainText("Slope", { timeout: 30_000 });

    await editor.click();
    await cms.keyboard.press("ControlOrMeta+A");
    await cms.keyboard.type("Terrain steepness, ");
    await cms.getByRole("toolbar").getByLabel("Bold").click();
    await cms.keyboard.type("edited in the CMS");

    await cms.getByRole("button", { name: "Publish changes" }).click();
    await expect(cms.getByText(/updated successfully/i)).toBeVisible();
    await admin.close();

    const published = await api.get(`${API}/indicators/${INDICATOR.id}?locale=en&depth=0`);
    // Select-all keeps the first block's type, so the text lands in whatever heading the
    // description opened with; only the inline Markdown is asserted.
    expect(((await published.json()) as { description: string }).description).toMatch(
      /Terrain steepness, \*\*edited in the CMS\*\*$/,
    );

    await page.goto("/en/reports/indicators");
    await dismissCookieConsent(page);
    const panel = page.getByRole("complementary");
    await panel.getByRole("button", { name: "Expand all" }).click();

    const row = indicatorRow(page, panel, INDICATOR.name);
    await row.scrollIntoViewIfNeeded();
    await infoButton(row).click();

    const info = page.getByRole("dialog");
    await expect(info.locator("strong", { hasText: "edited in the CMS" })).toBeVisible();
    await expect(info).not.toContainText("**");
  });
});
