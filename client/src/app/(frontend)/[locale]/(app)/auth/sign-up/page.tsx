import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { requireGuest } from "@/lib/auth/require-guest";

import { SignupForm } from "@/containers/auth/sign-up";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/sign-up">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-signup-page-title"),
    description: t("metadata-signup-page-description"),
  };
}

export default async function SignUpPage({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/sign-up">) {
  const { locale } = await params;
  const { redirectUrl } = await searchParams;
  await requireGuest(locale as Locale, redirectUrl);

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <SignupForm />
      </div>
    </section>
  );
}
