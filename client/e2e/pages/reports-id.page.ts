import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

const LABELS: Record<
  Locale,
  {
    save: string;
    makeACopy: string;
    edit: string;
    cancel: string;
    editReport: string;
    closeEditing: string;
    share: string;
    download: string;
    duplicate: string;
    newReport: string;
    help: string;
    openMenu: string;
    knowledgeResources: string;
    notFoundTitle: string;
    shareCopyTitle: string;
    selectedArea: string;
  }
> = {
  en: {
    save: "Save",
    makeACopy: "Make a copy",
    edit: "Edit",
    cancel: "Cancel",
    editReport: "Edit report",
    closeEditing: "Close editing",
    share: "Share",
    download: "Download",
    duplicate: "Duplicate",
    newReport: "Start a New Report",
    help: "Help",
    openMenu: "Open menu",
    knowledgeResources: "Additional knowledge resources",
    notFoundTitle: "404 - REPORT NOT FOUND",
    shareCopyTitle: "Share & Save",
    selectedArea: "Selected area",
  },
  es: {
    save: "Guardar",
    makeACopy: "Hacer una copia",
    edit: "Editar",
    cancel: "Cancelar",
    editReport: "Editar reporte",
    closeEditing: "Cerrar edición",
    share: "Compartir",
    download: "Descargar",
    duplicate: "Duplicar",
    newReport: "Iniciar un nuevo informe",
    help: "Ayuda",
    openMenu: "Open menu",
    knowledgeResources: "Recursos adicionales de conocimiento",
    notFoundTitle: "404 - REPORTE NO ENCONTRADO",
    shareCopyTitle: "Compartir y salvar reporte",
    selectedArea: "Área seleccionada",
  },
  pt: {
    save: "Salvar",
    makeACopy: "Fazer uma cópia",
    edit: "Editar",
    cancel: "Cancelar",
    editReport: "Editar relatório",
    closeEditing: "Fechar edição",
    share: "Compartilhar",
    download: "Descarregar",
    duplicate: "Duplicar",
    newReport: "Iniciar um novo relatório",
    help: "Ajuda",
    openMenu: "Open menu",
    knowledgeResources: "Recursos adicionais de conhecimento",
    notFoundTitle: "404 - RELATÓRIO NÃO ENCONTRADO",
    shareCopyTitle: "Compartilhar e salvar relatório",
    selectedArea: "Área selecionada",
  },
};

export class ReportsIdPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly saveButton: Locator;
  readonly makeACopyButton: Locator;
  readonly editTitleButton: Locator;
  readonly actionsMenuButton: Locator;
  readonly editReportButton: Locator;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.saveButton = page.getByRole("button", { name: l.save, exact: true });
    this.makeACopyButton = page.getByRole("button", { name: l.makeACopy });
    this.editTitleButton = page.getByRole("button", { name: l.edit, exact: true });
    this.actionsMenuButton = page.getByRole("button", { name: l.openMenu });
    this.editReportButton = page.getByRole("button", { name: l.editReport });
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
    await expect(
      this.page.locator("h2").first(),
    ).toBeVisible({ timeout: 30_000 });
  }

  /** Verify the report title matches the expected text. */
  async expectTitle(title: string) {
    await expect(this.page.getByRole("heading", { name: title, level: 2 })).toBeVisible({
      timeout: 10_000,
    });
  }

  /** Verify the default "Selected area" title is displayed. */
  async expectDefaultTitle() {
    const l = LABELS[this.locale];
    await this.expectTitle(l.selectedArea);
  }

  // ---------------------------------------------------------------------------
  // Draft disclaimer
  // ---------------------------------------------------------------------------

  /** Verify that the draft disclaimer is visible on the page. */
  async expectDraftDisclaimerVisible() {
    // The disclaimer text contains "temporary" and "expire" (in English)
    // We match on the translation key pattern: "This report is temporary and will expire in X days"
    await expect(
      this.page.getByText(/temporary.*expire|temporal.*caduca|temporario.*expira/i),
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Verify that the draft disclaimer is not visible. */
  async expectDraftDisclaimerNotVisible() {
    await expect(
      this.page.getByText(/temporary.*expire|temporal.*caduca|temporario.*expira/i),
    ).not.toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Save / Make a copy buttons
  // ---------------------------------------------------------------------------

  async expectSaveButtonVisible() {
    await expect(this.saveButton).toBeVisible({ timeout: 10_000 });
  }

  async expectSaveButtonNotVisible() {
    await expect(this.saveButton).not.toBeVisible();
  }

  async expectMakeACopyButtonVisible() {
    await expect(this.makeACopyButton).toBeVisible({ timeout: 10_000 });
  }

  async expectMakeACopyButtonNotVisible() {
    await expect(this.makeACopyButton).not.toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Title editing
  // ---------------------------------------------------------------------------

  async expectEditTitleButtonVisible() {
    await expect(this.editTitleButton).toBeVisible({ timeout: 10_000 });
  }

  async expectEditTitleButtonNotVisible() {
    await expect(this.editTitleButton).not.toBeVisible();
  }

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

  /** Click the cancel (X) button to discard the title edit. */
  async cancelTitleEdit() {
    await this.page.getByRole("button", { name: LABELS[this.locale].cancel, exact: true }).click();
  }

  // ---------------------------------------------------------------------------
  // Edit Report sidebar toggle
  // ---------------------------------------------------------------------------

  async clickEditReport() {
    await this.editReportButton.click();
  }

  async expectEditReportButtonVisible() {
    await expect(this.editReportButton).toBeVisible({ timeout: 10_000 });
  }

  async expectCloseEditingButtonVisible() {
    const l = LABELS[this.locale];
    await expect(
      this.page.getByRole("button", { name: l.closeEditing }),
    ).toBeVisible({ timeout: 5_000 });
  }

  // ---------------------------------------------------------------------------
  // Actions menu
  // ---------------------------------------------------------------------------

  /** Open the actions dropdown menu (ellipsis button). */
  async openActionsMenu() {
    await this.actionsMenuButton.click();
  }

  /** Verify all expected items are visible in the opened actions menu. */
  async expectActionsMenuItems() {
    const l = LABELS[this.locale];
    await expect(this.page.getByRole("menuitem", { name: l.share })).toBeVisible();
    await expect(this.page.getByRole("menuitem", { name: l.download })).toBeVisible();
    await expect(this.page.getByRole("menuitem", { name: l.duplicate })).toBeVisible();
    await expect(this.page.getByRole("menuitem", { name: l.newReport })).toBeVisible();
    await expect(this.page.getByRole("menuitem", { name: l.help })).toBeVisible();
  }

  /** Click the Share action from the actions menu. */
  async clickShareAction() {
    const l = LABELS[this.locale];
    await this.page.getByRole("menuitem", { name: l.share }).click();
  }

  /** Click the Duplicate action from the actions menu. */
  async clickDuplicateAction() {
    const l = LABELS[this.locale];
    await this.page.getByRole("menuitem", { name: l.duplicate }).click();
  }

  // ---------------------------------------------------------------------------
  // Share dialog
  // ---------------------------------------------------------------------------

  /** Verify the share dialog is open and contains the report URL. */
  async expectShareDialogWithUrl(reportId: string) {
    const l = LABELS[this.locale];
    // The dialog has both an sr-only h2 (DialogTitle) and a visible h3 with the same text.
    // Target the visible h3 to avoid strict mode violation.
    await expect(this.page.locator("h3", { hasText: l.shareCopyTitle })).toBeVisible({
      timeout: 5_000,
    });
    // The share URL should contain the report ID
    await expect(this.page.getByText(new RegExp(`/reports/${reportId}`))).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Knowledge resources
  // ---------------------------------------------------------------------------

  async expectKnowledgeResourcesVisible() {
    const l = LABELS[this.locale];
    await expect(
      this.page.getByRole("heading", { name: l.knowledgeResources }),
    ).toBeVisible({ timeout: 30_000 });
  }

  // ---------------------------------------------------------------------------
  // Not found page
  // ---------------------------------------------------------------------------

  async expectNotFound() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.notFoundTitle)).toBeVisible({ timeout: 30_000 });
  }
}
