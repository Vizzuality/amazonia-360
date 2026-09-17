import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { requireGuest } from "@/lib/auth/require-guest";

import { SignInForm } from "@/containers/auth/sign-in";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-signin-page-title"),
    description: t("metadata-signin-page-description"),
  };
}

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/sign-in">) {
  const { locale } = await params;
  const { redirectUrl } = await searchParams;
  await requireGuest(locale as Locale, redirectUrl);

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <SignInForm />
      </div>
    </section>
  );
}
