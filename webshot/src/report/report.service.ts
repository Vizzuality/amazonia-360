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
    webshotConfig: PdfReportWebshotConfig
  ): Promise<Buffer> {
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
    const baselineRequestManagerWaitMs = 60_000;
    const baselineRequestManagerDebounceIntervalMs = 20_000;

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

      page.on("request", (request) => {
        if (request.frame() === page!.mainFrame()) {
          this.logger.log("Sent request for main frame:");
          this.logger.log(
            `>> ${request.method()} ${request.url()} | headers=${JSON.stringify(
              request.headers()
            )}`
          );
        }
      });

      page.on("response", async (response) => {
        if (response.request().frame() === page!.mainFrame()) {
          this.logger.log("Sent response for main frame:");
          this.logger.log(
            `<< ${response.status()} ${response.url()} | headers=${JSON.stringify(
              response.headers()
            )}`
          );
        }
      });

      page.on("requestfinished", (request) => {
        if (request.url() === targetUrl) {
          this.logger.log("Sent response for target:");
          this.logger.log(
            `Main navigation request headers: ${JSON.stringify(
              request.headers()
            )}`
          );
        }
      });

      // Pass through browser console to our own service's console
      page.on("console", consolePassthrough);

      // Set up the request manager to determine if the network is idle
      const requestManager = createRequestManager(
        page,
        this.logger,
        baselineRequestManagerWaitMs,
        baselineRequestManagerDebounceIntervalMs
      );
      requestManager.setupEvents();

      // Wait for the load event
      await page.goto(targetUrl, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });

      await page.waitForTimeout(2_000);

      // Set geometry if provided
      if (geometry) {
        await page.evaluate((geom) => {
          (
            window as unknown as {
              setGeometry: (geom: GeoJSON.GeoJSON) => void;
            }
          ).setGeometry(geom);
        }, geometry);
      }

      // Set generatedTextContent if provided
      if (generatedTextContent) {
        await page.evaluate((content) => {
          (
            window as unknown as {
              setGeneratedTextContent: (
                content: Record<string, unknown>
              ) => void;
            }
          ).setGeneratedTextContent(content);
        }, generatedTextContent);
      }

      // The delay awaited here should be enough to allow the application to
      // fully render the page. Everything else being equal, this may depend on
      // the kind of VM the service runs on, and any concurrent load on the VM,
      // which is why this wait is configurable via env vars, if overriding the
      // default is necessary. However, proper handling of concurrent load may
      // only be possible by switching to using a simple queue system to process
      // requests sequentially or with a given maximum parallelism.
      await page.waitForTimeout(
        Config.getNumber("browser.waitMsBeforeTakingSnapshot")
      );
      await page.emulateMedia({ media: "screen" });

      // Generate PDF from screenshots
      const pdfBuffer = await page.pdf({
        format: Config.getString("pdf.pageFormat") || undefined,
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
      this.logger.error("Original error:", error);
      this.logger.error("Modified error message:");
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
