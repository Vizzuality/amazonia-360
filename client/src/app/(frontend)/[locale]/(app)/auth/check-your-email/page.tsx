import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { CheckYourEmail } from "@/containers/auth/check-your-email";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/check-your-email">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-check-your-email-page-title"),
    description: t("metadata-check-your-email-page-description"),
  };
}

export default async function CheckYourEmailPage({
  searchParams,
}: PageProps<"/[locale]/auth/check-your-email">) {
  const { email } = await searchParams;

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <CheckYourEmail email={typeof email === "string" ? email : undefined} />
      </div>
    </section>
  );
}
