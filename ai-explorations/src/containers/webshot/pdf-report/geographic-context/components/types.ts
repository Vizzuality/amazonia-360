import { Locale } from "use-intl";

import { Report } from "@/payload-types";

export interface DataRowProps {
  id: number;
  locale: Locale;
  location: Report["location"];
  modules: readonly string[] | null;
}
