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
    signIn: string;
    accountCreated: RegExp;
    accountCreationFailed: RegExp;
  }
> = {
  en: {
    heading: "Create an account",
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signIn: "Sign in",
    accountCreated: /account created successfully/i,
    accountCreationFailed: /failed to create account/i,
  },
  es: {
    heading: "Crear una cuenta",
    name: "Nombre",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    signIn: "Iniciar sesión",
    accountCreated: /cuenta creada correctamente/i,
    accountCreationFailed: /error al crear la cuenta/i,
  },
  pt: {
    heading: "Criar uma conta",
    name: "Nome",
    email: "E-mail",
    password: "Senha",
    confirmPassword: "Confirmar senha",
    signIn: "Entrar",
    accountCreated: /conta criada com sucesso/i,
    accountCreationFailed: /falha ao criar conta/i,
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
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly signInLink: Locator;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.heading = page.locator('[data-slot="card-title"]', { hasText: l.heading });
    this.nameInput = page.getByLabel(l.name);
    this.emailInput = page.getByLabel(l.email);
    this.passwordInput = page.getByLabel(l.password, { exact: true });
    this.confirmPasswordInput = page.getByLabel(l.confirmPassword);
    this.termsCheckbox = page.getByRole("checkbox");
    this.submitButton = page.locator('button[type="submit"]');
    this.signInLink = page
      .locator('[data-slot="card-footer"]')
      .getByRole("link", { name: l.signIn });
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
    await expect(this.termsCheckbox).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async checkTerms() {
    await this.termsCheckbox.check();
  }

  async submit() {
    await this.submitButton.click();
  }

  async fillAndSubmit(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms?: boolean;
  }) {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.confirmPassword);
    if (data.acceptTerms !== false) {
      await this.checkTerms();
    }
    await this.submit();
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5_000 });
  }

  async expectAccountCreatedToast() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.accountCreated)).toBeVisible({ timeout: 30_000 });
  }

  async expectAccountCreationFailedToast() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.accountCreationFailed)).toBeVisible({ timeout: 30_000 });
  }

  async expectRedirectedToCheckEmail() {
    await expect(this.page).toHaveURL(/\/auth\/check-your-email/, { timeout: 15_000 });
  }
}
