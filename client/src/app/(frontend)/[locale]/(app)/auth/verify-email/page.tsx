import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { VerifyEmail } from "@/containers/auth/verify-email";

import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-verify-email-page-title"),
    description: t("metadata-verify-email-page-description"),
  };
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;

  const { token } = await searchParams;

  if (!token || Array.isArray(token)) {
    redirect({
      href: "/auth/sign-in",
      locale,
    });
  }

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <VerifyEmail token={token as string} />
      </div>
    </section>
  );
}
