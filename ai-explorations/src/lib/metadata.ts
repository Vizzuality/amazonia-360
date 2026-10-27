import type { Locale } from "use-intl";

import { getTranslations } from "@/i18n/server";

export type PageMetadata = {
  title: string;
  description: string;
};

type MetadataName =
  | "home-page"
  | "partners-page"
  | "report-page"
  | "my-reports-layout"
  | "signin-page"
  | "signup-page"
  | "check-your-email-page"
  | "verify-email-page"
  | "forgot-password-page"
  | "reset-password-page";

export async function getPageMetadata(locale: Locale, name: MetadataName): Promise<PageMetadata> {
  const t = await getTranslations({ locale });

  return {
    title: t(`metadata-${name}-title`),
    description: t(`metadata-${name}-description`),
  };
}

export function getHeadMeta(metadata: PageMetadata | undefined) {
  if (!metadata) return [];

  return [{ title: metadata.title }, { name: "description", content: metadata.description }];
}
