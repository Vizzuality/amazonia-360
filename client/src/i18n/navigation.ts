import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

const { redirect } = createNavigation(routing);

export { redirect };
export { Link, LocaleLink, usePathname, useRouter } from "./navigation-client";
