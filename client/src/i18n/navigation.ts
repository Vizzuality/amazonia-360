import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation APIs that consider the routing
// configuration — and, on top of that, the active country. Everything that builds an
// in-app URL goes through here, so the scoped/unscoped rule lives in one place.
//
// `redirect` is the only piece Server Components use, so it is the only piece that can
// live outside the client boundary.
const { redirect } = createNavigation(routing);

export { redirect };
export { Link, usePathname, useRouter } from "./navigation-client";
