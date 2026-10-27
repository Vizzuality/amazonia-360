import { createServerFn } from "@tanstack/react-start";

import { basicAuthFnMiddleware } from "@/lib/server/basic-auth";

// Server functions run in the RSC environment, where `react` resolves to its server build:
// keep this module free of static imports that touch client React APIs at load time.
export const getServerTimeZoneFn = createServerFn({ method: "GET" })
  .middleware([basicAuthFnMiddleware])
  .handler(async () => Intl.DateTimeFormat().resolvedOptions().timeZone);
