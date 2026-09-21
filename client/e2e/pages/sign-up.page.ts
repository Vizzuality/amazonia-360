import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

const LABELS: Record<
  Locale,
  {
    heading: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    countriesLabel: string;
  }
> = {
  en: {
    heading: "Create an account",
    name: "Full name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    countriesLabel: "Countries of interest",
  },
  es: {
    heading: "Crear una cuenta",
    name: "Nombre completo",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    countriesLabel: "Países de interés",
  },
  pt: {
    heading: "Criar uma conta",
    name: "Nome completo",
    email: "E-mail",
    password: "Senha",
    confirmPassword: "Confirmar senha",
    countriesLabel: "Países de interesse",
  },
};

export class SignUpPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly communityOptInCheckbox: Locator;
  readonly countriesGroup: Locator;
  readonly submitButton: Locator;
  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.heading = page.locator('[data-slot="card-title"]', { hasText: l.heading });
    this.nameInput = page.getByLabel(l.name);
    this.emailInput = page.getByLabel(l.email);
    this.passwordInput = page.getByLabel(l.password, { exact: true });
    this.confirmPasswordInput = page.getByLabel(l.confirmPassword);
    this.communityOptInCheckbox = page.locator("#communityOptIn");
    this.countriesGroup = page.getByRole("group", { name: l.countriesLabel });
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto(`/${this.locale}/auth/sign-up`);
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.communityOptInCheckbox).toBeVisible();
    await expect(this.countriesGroup).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectRedirectedTo(urlPattern: RegExp) {
    await expect(this.page).toHaveURL(urlPattern, { timeout: 15_000 });
  }
}
