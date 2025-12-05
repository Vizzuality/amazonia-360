import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ResetPasswordForm } from "@/containers/auth/reset-password";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-reset-password-page-title"),
    description: t("metadata-reset-password-page-description"),
  };
}

export default async function ResetPasswordPage(
  _props: PageProps<"/[locale]/auth/reset-password">,
) {
  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </section>
  );
}
