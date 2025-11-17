import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CheckYourEmail } from "@/containers/auth/check-your-email";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-check-your-email-page-title"),
    description: t("metadata-check-your-email-page-description"),
  };
}

export default async function CheckYourEmailPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <CheckYourEmail />
      </div>
    </section>
  );
}
