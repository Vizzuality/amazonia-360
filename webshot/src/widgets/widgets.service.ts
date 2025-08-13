import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { Config } from "../utils/config";
import { consolePassthrough } from "../utils/console-passthrough.utils";
import { createRequestManager } from "../utils/request-manager";
import { WidgetAsImageWebshotConfig } from "./widgets.controller";

@Injectable()
export class WidgetsService {
  private readonly logger = new Logger(WidgetsService.name);

  async generatePngSnapshot(
    webshotConfig: WidgetAsImageWebshotConfig,
  ): Promise<Buffer> {
    const { pagePath, params } = webshotConfig;
    const appBaseUrl = Config.getString("app.baseUrl").replace(/\/+$/, "");
    const targetUrl = `${appBaseUrl}${pagePath}`;
    this.logger.log(`Starting PNG generation for ${targetUrl}`);

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
      const requestManager = createRequestManager(page, this.logger);
      requestManager.setupEvents();

      // Wait for the load event
      await page.goto(targetUrl, {
        waitUntil: "load",
        timeout: 30_000,
      });

      // This delay tries to make sure the Javascript has loaded in order to
      // pass geometry and/or generatedTextContent to the front-end
      await page.waitForTimeout(2_000);

      // Set params if provided
      if (params) {
        await page.evaluate((p) => {
          (
            window as unknown as {
              setWidgetSettings: (content: Record<string, unknown>) => void;
            }
          ).setWidgetSettings(p);
        }, params);
      }

      // Wait until the network is idle
      await requestManager.isIdle();

      // The delay awaited here should be enough to allow the application to
      // fully render the page. Everything else being equal, this may depend on
      // the kind of VM the service runs on, and any concurrent load on the VM,
      // which is why this wait is configurable via env vars, if overriding the
      // default is necessary. However, proper handling of concurrent load may
      // only be possible by switching to using a simple queue system to process
      // requests sequentially or with a given maximum parallelism.
      await page.waitForTimeout(
        Config.getNumber("browser.waitMsBeforeTakingSnapshot"),
      );

      // Use the regular styles instead of print styles to generate the PNG
      // snapshot. See:
      // https://playwright.dev/docs/api/class-page#page-emulate-media
      await page.emulateMedia({ media: "screen" });

      // Generate PDF from screenshots
      const pngBuffer = await page.screenshot({
        type: "png",
      });
      this.logger.log("PNG snapshot generation completed successfully");

      return pngBuffer;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const msg = `Failed to generate PNG snapshot for ${targetUrl}: ${errorMessage}${errorStack ? `\n${errorStack}` : ""}`;
      this.logger.error(msg);
      throw new Error(msg);
    } finally {
      await page?.close();
      await browser?.close();
    }
  }
}
