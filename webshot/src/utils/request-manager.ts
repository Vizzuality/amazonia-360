import { Logger } from "@nestjs/common";
import { debounce } from "lodash";
import { Page } from "playwright";

export const createRequestManager = (
  page: Page,
  logger: Logger,
  timeoutMs: number = 60_000,
  debounceDelayMs: number = 20_000,
) => {
  const activeRequests: Set<string> = new Set();
  let timeoutId: NodeJS.Timeout | undefined = undefined;

  let resolve: (() => void) | undefined = undefined;
  let reject: (() => Error) | undefined = undefined;
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve;
    reject = () => new Error("Timeout while rendering page");
  });

  // This function is debounced so that every time a request is started, finished or failed, a
  // small delay is created before we check again if the network is idle
  const checkIfIdle = debounce(() => {
    if (activeRequests.size === 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      logger.log("Network is idle");
      resolve?.();
    }
  }, debounceDelayMs);

  return {
    setupEvents: () => {
      page.on("request", (request) => {
        const url = request.url();
        // blob requests are ignored as they may be linked to Mapbox WebWorkers and the front-end
        // application doesn't create any
        if (!url.startsWith("blob:")) {
          activeRequests.add(url);
          checkIfIdle();
        }
      });

      page.on("requestfinished", (request) => {
        const url = request.url();
        activeRequests.delete(url);
        checkIfIdle();
      });

      page.on("requestfailed", (request) => {
        const url = request.url();
        activeRequests.delete(url);
        checkIfIdle();
      });
    },
    isIdle: () => {
      // Reject if the timeout has passed
      timeoutId = setTimeout(() => {
        reject?.();
      }, timeoutMs);

      return promise;
    },
  };
};
