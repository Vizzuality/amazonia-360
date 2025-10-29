import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignInForm } from "@/containers/auth/sign-in";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-signin-page-title"),
    description: t("metadata-signin-page-description"),
  };
}

export default async function SignInPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto max-w-sm">
        <SignInForm />
      </div>
    </section>
  );
}
