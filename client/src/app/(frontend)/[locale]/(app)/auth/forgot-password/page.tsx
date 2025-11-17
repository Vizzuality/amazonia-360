import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/containers/auth/forgot-password";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-forgot-password-page-title"),
    description: t("metadata-forgot-password-page-description"),
  };
}

export default async function ForgotPasswordPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
