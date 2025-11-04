import { Suspense } from "react";

import { notFound } from "next/navigation";

import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }));
}

export default async function WebshotLayout({
  children,
  params,
}: LayoutProps<"/[locale]/webshot">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <>
      <Suspense fallback={null}>{children}</Suspense>
    </>
  );
}
