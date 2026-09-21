import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

const LABELS: Record<
  Locale,
  {
    save: string;
    edit: string;
    duplicate: string;
    openMenu: string;
  }
> = {
  en: {
    save: "Save",
    edit: "Edit",
    duplicate: "Duplicate",
    openMenu: "Open menu",
  },
  es: {
    save: "Guardar",
    edit: "Editar",
    duplicate: "Duplicar",
    openMenu: "Open menu",
  },
  pt: {
    save: "Salvar",
    edit: "Editar",
    duplicate: "Duplicar",
    openMenu: "Open menu",
  },
};

export class ReportsIdPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly saveButton: Locator;
  readonly editTitleButton: Locator;
  readonly actionsMenuButton: Locator;
  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.saveButton = page.getByRole("button", { name: l.save, exact: true });
    this.editTitleButton = page.getByRole("button", { name: l.edit, exact: true });
    this.actionsMenuButton = page.getByRole("button", { name: l.openMenu });
  }

  async goto(reportId: string) {
    await this.page.goto(`/${this.locale}/reports/${reportId}`);
  }

  // ---------------------------------------------------------------------------
  // Page load assertions
  // ---------------------------------------------------------------------------

  /** Wait for the report view page to load by checking for the title area. */
  async expectLoaded() {
    // The report title renders as an h2, or the default "Selected area" text
    await expect(this.page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
  }

  /** Verify the report title matches the expected text. */
  async expectTitle(title: string) {
    await expect(this.page.getByRole("heading", { name: title, level: 2 })).toBeVisible({
      timeout: 10_000,
    });
  }

  // ---------------------------------------------------------------------------
  // Save / Make a copy buttons
  // ---------------------------------------------------------------------------

  /** Save the report and wait for the update to land, so a reload can prove it persisted. */
  async saveReport() {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/reports") &&
        response.ok(),
    );
    await this.saveButton.click();
    await saved;
  }

  // ---------------------------------------------------------------------------
  // Title editing
  // ---------------------------------------------------------------------------

  /** Click the pen icon to enter title edit mode. */
  async startTitleEdit() {
    await this.editTitleButton.click();
  }

  /** Type a new title into the title input field. */
  async typeTitleValue(newTitle: string) {
    const input = this.page.locator("#title");
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.clear();
    await input.fill(newTitle);
  }

  /** Click the confirm (check) button to save the title edit. */
  async confirmTitleEdit() {
    // The confirm button is inside the title edit form
    const confirmButton = this.page.locator('form#report-title button[type="submit"]');
    await confirmButton.click();
  }

  // ---------------------------------------------------------------------------
  // Edit Report sidebar toggle
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Actions menu
  // ---------------------------------------------------------------------------

  /** Open the actions dropdown menu (ellipsis button). */
  async openActionsMenu() {
    await this.actionsMenuButton.click();
  }

  /** Click the Duplicate action from the actions menu. */
  async clickDuplicateAction() {
    const l = LABELS[this.locale];
    await this.page.getByRole("menuitem", { name: l.duplicate }).click();
  }

  // ---------------------------------------------------------------------------
  // Share dialog
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Knowledge resources
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Not found page
  // ---------------------------------------------------------------------------
}
