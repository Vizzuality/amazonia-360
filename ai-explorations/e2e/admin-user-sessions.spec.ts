import { randomUUID } from "node:crypto";

import { type Page, test, expect } from "@playwright/test";

import { signIn } from "./helpers/auth";
import { getTestAdmin, getUniqueEmail, skipWithoutSeedSecret } from "./helpers/credentials";
import { expectHydrated } from "./helpers/hydration";
import { seedAdmin, seedUser } from "./helpers/seed";

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

type Me = { user: { email: string } | null };

async function getMe(page: Page, path: string): Promise<Me> {
  const response = await page.request.get(path);
  expect(response.ok(), `GET ${path}`).toBe(true);
  return (await response.json()) as Me;
}

async function signInAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(getTestAdmin().email);
  await page.getByLabel("Password", { exact: true }).fill(getTestAdmin().password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
}

async function expectAdminSignedIn(page: Page) {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
  expect((await getMe(page, "/v1/api/admins/me")).user?.email).toBe(getTestAdmin().email);
}

async function expectUserSignedIn(page: Page, email: string) {
  await page.goto("/en/private/my-reports");
  await expect(page).toHaveURL(/\/en\/private\/my-reports$/, { timeout: 30_000 });
  expect((await getMe(page, "/v1/app-api/users/me")).user?.email).toBe(email);
}

test("an admin session and a frontend session coexist and sign out independently", async ({
  page,
  request,
}) => {
  const user = { email: getUniqueEmail("e2e-sessions"), password: randomUUID() };
  await seedAdmin(request, getTestAdmin());
  await seedUser(request, user);

  await signIn(page, user);
  await signInAdmin(page);
  await expectAdminSignedIn(page);
  await expectUserSignedIn(page, user.email);
  expect((await getMe(page, "/v1/app-api/admins/me")).user).toBeNull();

  const avatar = page.getByRole("banner").getByRole("button", { name: "ET", exact: true });
  await expectHydrated(avatar);
  await avatar.click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/en\/auth\/sign-in/, { timeout: 30_000 });
  expect((await getMe(page, "/v1/app-api/users/me")).user).toBeNull();
  await expectAdminSignedIn(page);

  await signIn(page, user);
  await expectAdminSignedIn(page);

  await page.goto("/admin/logout");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 30_000 });
  expect((await getMe(page, "/v1/api/admins/me")).user).toBeNull();
  await expectUserSignedIn(page, user.email);
});
