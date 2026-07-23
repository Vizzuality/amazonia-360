import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

const LABELS: Record<
  Locale,
  {
    heading: string;
    email: string;
    backToSignIn: string;
    resetEmailSent: RegExp;
    resetEmailFailed: RegExp;
  }
> = {
  en: {
    heading: "Forgot password",
    email: "Email",
    backToSignIn: "Back to sign in",
    resetEmailSent: /password reset email sent successfully/i,
    resetEmailFailed: /failed to send password reset email/i,
  },
  es: {
    heading: "Olvidé la contraseña",
    email: "Correo electrónico",
    backToSignIn: "Volver a iniciar sesión",
    resetEmailSent: /correo de restablecimiento de contraseña enviado correctamente/i,
    resetEmailFailed: /error al enviar el correo de restablecimiento/i,
  },
  pt: {
    heading: "Esqueci a senha",
    email: "E-mail",
    backToSignIn: "Voltar para entrar",
    resetEmailSent: /e-mail de redefinição de senha enviado com sucesso/i,
    resetEmailFailed: /falha ao enviar e-mail de redefinição/i,
  },
};

export class ForgotPasswordPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToSignInLink: Locator;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.heading = page.locator('[data-slot="card-title"]', { hasText: l.heading });
    this.emailInput = page.getByLabel(l.email);
    this.submitButton = page.locator('button[type="submit"]');
    this.backToSignInLink = page.getByRole("link", { name: l.backToSignIn });
  }

  async goto() {
    await this.page.goto(`/${this.locale}/auth/forgot-password`);
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.emailInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async submit() {
    await this.submitButton.click();
  }

  async requestReset(email: string) {
    await this.fillEmail(email);
    await this.submit();
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5_000 });
  }

  async expectResetEmailSentToast() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.resetEmailSent)).toBeVisible({ timeout: 30_000 });
  }

  async expectResetEmailFailedToast() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.resetEmailFailed)).toBeVisible({ timeout: 30_000 });
  }
}
