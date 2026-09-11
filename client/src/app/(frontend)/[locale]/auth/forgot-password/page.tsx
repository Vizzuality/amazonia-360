import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "@/containers/auth/forgot-password";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-forgot-password-page-title"),
    description: t("metadata-forgot-password-page-description"),
  };
}

export default async function ForgotPasswordPage(
  _props: PageProps<"/[locale]/auth/forgot-password">,
) {
  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
