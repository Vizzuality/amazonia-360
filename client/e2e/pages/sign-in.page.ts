import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

const LABELS: Record<Locale, {
  heading: string;
  email: string;
  password: string;
  forgotPassword: string;
  signUp: string;
  loginFailed: RegExp;
}> = {
  en: {
    heading: "Welcome",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot your password?",
    signUp: "Sign up",
    loginFailed: /failed to log in/i,
  },
  es: {
    heading: "Bienvenido",
    email: "Correo electrónico",
    password: "Contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    signUp: "Registrarse",
    loginFailed: /error al iniciar sesión/i,
  },
  pt: {
    heading: "Bem-vindo",
    email: "E-mail",
    password: "Senha",
    forgotPassword: "Esqueceu sua senha?",
    signUp: "Cadastrar-se",
    loginFailed: /falha no login/i,
  },
};

export class SignInPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.heading = page.locator('[data-slot="card-title"]', { hasText: l.heading });
    this.emailInput = page.getByLabel(l.email);
    this.passwordInput = page.getByLabel(l.password);
    this.submitButton = page.locator('button[type="submit"]');
    this.forgotPasswordLink = page.getByRole("link", { name: l.forgotPassword });
    this.signUpLink = page.getByRole("link", { name: l.signUp });
  }

  async goto(redirectUrl?: string) {
    const params = redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : "";
    await this.page.goto(`/${this.locale}/auth/sign-in${params}`);
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async signIn(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5_000 });
  }

  async expectLoginFailedToast() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.loginFailed)).toBeVisible({ timeout: 30_000 });
  }

  async expectRedirectedTo(urlPattern: RegExp) {
    await expect(this.page).toHaveURL(urlPattern, { timeout: 15_000 });
  }
}
