import fs from "node:fs";
import path from "node:path";

import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

/**
 * Sample ArcGIS JSON geometries in Web Mercator (WKID 102100) for the Amazon
 * region.  These mirror the output of `graphic.geometry.toJSON()` that a real
 * map drawing session would produce.
 */
const GEOMETRIES = {
  point: {
    x: -7013128,
    y: -334111,
    spatialReference: { wkid: 102100 },
  },
  polyline: {
    paths: [
      [
        [-7180000, -446000],
        [-6958000, -222000],
        [-6847000, -501000],
      ],
    ],
    spatialReference: { wkid: 102100 },
  },
  polygon: {
    rings: [
      [
        [-7124000, -446000],
        [-6902000, -446000],
        [-6902000, -222000],
        [-7124000, -222000],
        [-7124000, -446000],
      ],
    ],
    spatialReference: { wkid: 102100 },
  },
} as const;

/** Default buffer values (km) matching `BUFFERS` in constants/map.ts */
const DEFAULT_BUFFERS = { point: 60, polyline: 30, polygon: 0 } as const;

const LABELS: Record<
  Locale,
  {
    heading: string;
    point: string;
    area: string;
    line: string;
    uploadDialogTitle: string;
    bufferSize: string;
    createReport: string;
    selectAll: string;
  }
> = {
  en: {
    heading: "Get insights on your area of interest",
    point: "Point",
    area: "Area",
    line: "Line",
    uploadDialogTitle: "Upload area file",
    bufferSize: "Buffer size",
    createReport: "Create report",
    selectAll: "Select all",
  },
  es: {
    heading: "Obtenga información sobre su área de interés",
    point: "Punto",
    area: "Area",
    line: "Línea",
    uploadDialogTitle: "Cargar archivo",
    bufferSize: "Tamaño del búfer",
    createReport: "Crear reporte",
    selectAll: "Seleccionar todo",
  },
  pt: {
    heading: "Obter informações sobre a sua área de interesse",
    point: "Ponto",
    area: "Área",
    line: "Linha",
    uploadDialogTitle: "Carregar arquivo",
    bufferSize: "Tamanho da área de buffer",
    createReport: "Criar relatório",
    selectAll: "Selecionar tudo",
  },
};

export class ReportsPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly heading: Locator;
  readonly pointButton: Locator;
  readonly areaButton: Locator;
  readonly lineButton: Locator;
  readonly uploadButton: Locator;
  readonly bufferSlider: Locator;
  readonly createReportButton: Locator;
  readonly selectAllButton: Locator;
  readonly createButton: Locator;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    this.heading = page.getByRole("heading", { name: l.heading });
    // Drawing buttons are TooltipTrigger <button> elements with icon + text span.
    // Use locator text filter rather than accessible name to avoid aria-label ambiguity.
    this.pointButton = page.locator("button").filter({ hasText: l.point }).first();
    this.areaButton = page.locator("button").filter({ hasText: l.area }).first();
    this.lineButton = page.locator("button").filter({ hasText: l.line }).first();
    this.uploadButton = page.locator("button").filter({ hasText: "Upload" }).first();
    this.bufferSlider = page.getByRole("slider");
    this.createReportButton = page.getByRole("button", { name: l.createReport });
    this.selectAllButton = page.getByRole("button", { name: l.selectAll });
    this.createButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto(`/${this.locale}/reports`);
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
    await expect(this.pointButton).toBeVisible();
    await expect(this.areaButton).toBeVisible();
    await expect(this.lineButton).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Drawing tools (via E2E bridge — injects geometry into Jotai locationAtom)
  // ---------------------------------------------------------------------------

  /**
   * Wait for the E2E bridge function to be available on `window`.
   * The bridge component exposes `window.__E2E_SET_LOCATION__` after React
   * hydration.
   */
  private async waitForBridge() {
    await this.page.waitForFunction(() => typeof window.__E2E_SET_LOCATION__ === "function", null, {
      timeout: 15_000,
    });
  }

  /** Inject a point geometry via the bridge. */
  async drawPoint() {
    await this.waitForBridge();
    await this.page.evaluate(
      ({ geometry, buffer }) => {
        window.__E2E_SET_LOCATION__!({ type: "point", geometry, buffer });
      },
      { geometry: GEOMETRIES.point, buffer: DEFAULT_BUFFERS.point },
    );
  }

  /** Inject a polygon geometry via the bridge. */
  async drawPolygon() {
    await this.waitForBridge();
    await this.page.evaluate(
      ({ geometry, buffer }) => {
        window.__E2E_SET_LOCATION__!({ type: "polygon", geometry, buffer });
      },
      { geometry: GEOMETRIES.polygon, buffer: DEFAULT_BUFFERS.polygon },
    );
  }

  /** Inject a polyline geometry via the bridge. */
  async drawPolyline() {
    await this.waitForBridge();
    await this.page.evaluate(
      ({ geometry, buffer }) => {
        window.__E2E_SET_LOCATION__!({ type: "polyline", geometry, buffer });
      },
      { geometry: GEOMETRIES.polyline, buffer: DEFAULT_BUFFERS.polyline },
    );
  }

  // ---------------------------------------------------------------------------
  // Buffer controls
  // ---------------------------------------------------------------------------

  async expectBufferVisible() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.bufferSize)).toBeVisible({ timeout: 5_000 });
    await expect(this.bufferSlider).toBeVisible();
  }

  async expectBufferNotVisible() {
    const l = LABELS[this.locale];
    await expect(this.page.getByText(l.bufferSize)).not.toBeVisible();
  }

  /** Drag the slider thumb to approximately the target km value (range 1-100). */
  async setBufferValue(target: number) {
    const thumb = this.bufferSlider;
    await thumb.waitFor({ state: "visible", timeout: 5_000 });

    const thumbBox = await thumb.boundingBox();
    if (!thumbBox) throw new Error("Slider thumb bounding box not available");

    // Find the slider track to calculate positions
    const track = this.page.locator('[data-slot="slider"]');
    const trackBox = await track.boundingBox();
    if (!trackBox) throw new Error("Slider track bounding box not available");

    // Calculate target x position based on value (min=1, max=100)
    const fraction = (target - 1) / (100 - 1);
    const targetX = trackBox.x + fraction * trackBox.width;
    const thumbCenterY = thumbBox.y + thumbBox.height / 2;

    // Drag from the current thumb position to the target
    const thumbCenterX = thumbBox.x + thumbBox.width / 2;
    await this.page.mouse.move(thumbCenterX, thumbCenterY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, thumbCenterY, { steps: 10 });
    await this.page.mouse.up();

    // Wait for debounced update
    await this.page.waitForTimeout(1_000);
  }

  /** Verify the displayed buffer value matches the expected km string. */
  async expectBufferDisplayedValue(km: number) {
    await expect(this.page.getByText(`${km} km`)).toBeVisible({ timeout: 5_000 });
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------

  /**
   * MIME types that Chromium doesn't auto-detect from extension.
   * react-dropzone rejects files whose MIME type doesn't match the accept
   * config, so we must provide the correct type explicitly.
   */
  private static readonly MIME_OVERRIDES: Record<string, string> = {
    ".geojson": "application/geo+json",
  };

  /** Upload a file via the upload dialog. */
  async uploadFile(filePath: string) {
    await this.uploadButton.click();

    const l = LABELS[this.locale];
    const dialog = this.page.getByRole("dialog").filter({ hasText: l.uploadDialogTitle });
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // The Dropzone renders a hidden <input type="file"> inside the dialog
    const fileInput = dialog.locator('input[type="file"]');

    // Chromium doesn't recognise some extensions (e.g. .geojson) and assigns
    // an empty MIME type, which causes react-dropzone to reject the file.
    // Use the buffer overload to supply the correct MIME type when needed.
    const ext = path.extname(filePath).toLowerCase();
    const mimeOverride = ReportsPage.MIME_OVERRIDES[ext];

    if (mimeOverride) {
      await fileInput.setInputFiles({
        name: path.basename(filePath),
        mimeType: mimeOverride,
        buffer: fs.readFileSync(filePath),
      });
    } else {
      await fileInput.setInputFiles(filePath);
    }

    // Wait for the dialog to close after successful upload processing
    await expect(dialog).not.toBeVisible({ timeout: 30_000 });

    // Wait for location state to settle
    await this.page.waitForTimeout(2_000);
  }

  // ---------------------------------------------------------------------------
  // Location & report creation
  // ---------------------------------------------------------------------------

  /** Verify that the "Create report" button is visible (location has been set). */
  async expectLocationCreated() {
    await expect(this.createReportButton).toBeVisible({ timeout: 15_000 });
  }

  /** Open the topic selection dialog by clicking "Create report". */
  async openTopicDialog() {
    await this.createReportButton.click();
    // Wait for the topic dialog to appear
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // Wait for topics to load
    await expect(this.selectAllButton).toBeVisible({ timeout: 10_000 });
  }

  /** Click the "Select all" button to select all topics. */
  async selectAllTopics() {
    await this.selectAllButton.click();
  }

  /** Click the "Create" submit button inside the topic dialog form. */
  async submitReport() {
    await this.createButton.click();
  }

  /** Verify that the page redirected to a report detail page matching /reports/{id}. */
  async expectRedirectToReport() {
    await expect(this.page).toHaveURL(/\/reports\/[\w-]+/, { timeout: 30_000 });
  }

  /** Convenience method: open topic dialog, select all, submit, and verify redirect. */
  async createReportWithTopics() {
    await this.openTopicDialog();
    await this.selectAllTopics();
    await this.submitReport();
    await this.expectRedirectToReport();
  }
}
