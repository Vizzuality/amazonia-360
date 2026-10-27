import { createServerFn } from "@tanstack/react-start";

import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";

import * as z from "zod";

import { basicAuthFnMiddleware } from "@/lib/server/basic-auth";

import { routing } from "@/i18n/routing";

const getConfig = async () => (await import("@payload-config")).default;

// Reachable without the signed-in layout that gates the client's report pages.
export const getReportFn = createServerFn({ method: "GET" })
  .middleware([basicAuthFnMiddleware])
  .validator(z.object({ id: z.string(), locale: z.enum(routing.locales) }))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const { getPayload } = await import("payload");
    const payload = await getPayload({ config: await getConfig() });

    const { user } = await payload.auth({ headers: getRequestHeaders() });
    if (user?.collection !== "users") throw new Error("Unauthorized");

    const report = await payload.findByID({
      collection: "reports",
      id: data.id,
      locale: data.locale,
      overrideAccess: false,
      user,
    });

    // `Report` <-> `User` <-> `Account` is circular, which TanStack's serializable-type check rejects.
    return JSON.stringify(report);
  });
