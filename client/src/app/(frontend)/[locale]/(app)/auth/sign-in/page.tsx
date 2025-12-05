import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

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

export default async function SignInPage(_props: PageProps<"/[locale]/auth/sign-in">) {
  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <SignInForm />
      </div>
    </section>
  );
}
