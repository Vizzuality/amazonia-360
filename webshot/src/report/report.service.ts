import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { PdfReportWebshotConfig } from "./report.controller";
import { Config } from "../utils/config";
import { consolePassthrough } from "../utils/console-passthrough.utils";
import { createRequestManager } from "../utils/request-manager";

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  async generatePdfFromUrls(
    webshotConfig: PdfReportWebshotConfig,
  ): Promise<Uint8Array> {
    const { pagePath, geometry, generatedTextContent } = webshotConfig;
    const appBaseUrl = Config.getString("app.baseUrl").replace(/\/+$/, "");
    const targetUrl = `${appBaseUrl}${pagePath}`;

    this.logger.log(`Starting PDF generation for ${targetUrl}`);

    /**
     * As PDF reports become more complex, it will likely be necessary
     * to fine-tune these wait and debounce intervals, so that they
     * cover realistic times for each specific configuration of
     * reports (e.g. how many sections are included, which maps roughly
     * to number of assets to load, render times, etc.).
     * For this reason we start to define them as baseline constants,
     * with specific logic to multiply them or tweak them depending
     * on intended use cases to come later.
     */
    const waitMsBeforeTakingSnapshot: number = Config.getNumber(
      "browser.waitMsBeforeTakingSnapshot",
    );
    const baselineRequestManagerWaitMs = Config.getNumber(
      "browser.baselineRequestManagerWaitMs",
    );
    const baselineRequestManagerDebounceIntervalMs = Config.getNumber(
      "browser.baselineRequestManagerDebounceIntervalMs",
    );

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: Config.get<Array<string>>("browser.args"),
      });

      page = await browser.newPage({
        ...(() => {
          const username = Config.get<string>("app.basicAuth.user");
          const password = Config.get<string>("app.basicAuth.password");
          return username && password
            ? {
                httpCredentials: {
                  username,
                  password,
                },
              }
            : {};
        })(),
        // Render images with twice the resolution to avoid pixelization
        deviceScaleFactor: 2,
      });

      // Pass through browser console to our own service's console
      page.on("console", consolePassthrough);

      // Set up the request manager to determine if the network is idle
      const requestManager = createRequestManager(
        page,
        this.logger,
        baselineRequestManagerWaitMs,
        baselineRequestManagerDebounceIntervalMs,
      );
      requestManager.setupEvents();

      // Wait for the load event
      this.logger.log("Waiting for page to load");
      await page.goto(targetUrl, {
        waitUntil: "load",
        timeout: 30_000,
      });
      this.logger.log("Page was fully loaded");

      // This delay tries to make sure the Javascript has loaded in order to
      // pass geometry and/or generatedTextContent to the front-end
      await page.waitForTimeout(2_000);

      // Set geometry if provided
      if (geometry) {
        this.logger.log(
          "A GeoJSON geometry was provided: passing it through to the page",
        );
        await page.evaluate((geom) => {
          (
            window as unknown as {
              setGeometry: (geom: GeoJSON.GeoJSON) => void;
            }
          ).setGeometry(geom);
        }, geometry);
        this.logger.log("Done passing geometry through to the page");
      }

      // Set generatedTextContent if provided
      if (generatedTextContent) {
        this.logger.log(
          "Text content was provided: passing it through to the page",
        );
        await page.evaluate((content) => {
          (
            window as unknown as {
              setGeneratedTextContent: (
                content: Record<string, unknown>,
              ) => void;
            }
          ).setGeneratedTextContent(content);
        }, generatedTextContent);
        this.logger.log("Done passing text content through to the page");
      }

      // Wait until the network is idle
      this.logger.log("Waiting until network is idle");
      await requestManager.isIdle();
      this.logger.log("Network is idle: waiting for page to render");

      // The delay awaited here should be enough to allow the application to
      // fully render the page. Everything else being equal, this may depend on
      // the kind of VM the service runs on, and any concurrent load on the VM,
      // which is why this wait is configurable via env vars, if overriding the
      // default is necessary. However, proper handling of concurrent load may
      // only be possible by switching to using a simple queue system to process
      // requests sequentially or with a given maximum parallelism.
      this.logger.log(`Allowing time for the page to render...`);
      await page.waitForTimeout(waitMsBeforeTakingSnapshot);
      this.logger.log(`Waited ${waitMsBeforeTakingSnapshot}ms`);

      await page.emulateMedia({ media: "print" });

      // Generate PDF from screenshots
      const pdfBuffer = await page.pdf({
        width: Config.getString("pdf.pageWidth"),
        height: Config.getString("pdf.pageHeight"),
        scale: 1,
        // Use same scale factor as device to avoid pixelization
        landscape: Config.getString("pdf.pageOrientation") === "landscape",
        margin: {
          top: Config.getString("pdf.pageMargins.top"),
          bottom: Config.getString("pdf.pageMargins.bottom"),
          left: Config.getString("pdf.pageMargins.left"),
          right: Config.getString("pdf.pageMargins.right"),
        },
        printBackground: true,
      });

      this.logger.log("PDF generation completed successfully");

      return pdfBuffer;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const msg = `Failed to generate PDF for ${targetUrl}: ${errorMessage}${
        errorStack ? `\n${errorStack}` : ""
      }`;
      this.logger.error(msg);
      throw new Error(msg);
    } finally {
      await page?.close();
      await browser?.close();
    }
  }
}
