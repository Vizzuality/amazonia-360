import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-signup-page-title"),
    description: t("metadata-signup-page-description"),
  };
}

export default async function SignUpPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return <>Sign Up Page - locale: {locale}</>;
}
