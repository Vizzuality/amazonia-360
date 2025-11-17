import { Locale } from "next-intl";

import { Report } from "@/payload-types";

export interface DataRowProps {
  id: number;
  locale: Locale;
  location: Report["location"];
}
