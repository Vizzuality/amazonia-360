import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/containers/auth/reset-password";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-reset-password-page-title"),
    description: t("metadata-reset-password-page-description"),
  };
}

export default async function ResetPasswordPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </section>
  );
}
