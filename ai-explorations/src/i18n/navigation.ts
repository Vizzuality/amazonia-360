import { createNavigation } from "./create-navigation";
import { routing } from "./routing";

const { redirect } = createNavigation(routing);

export { redirect };
export { Link, LocaleLink, useLocaleRouter, usePathname, useRouter } from "./navigation-client";
