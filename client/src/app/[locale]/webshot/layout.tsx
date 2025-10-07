import { Suspense } from "react";

import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { hasLocale, Locale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import RootHead from "@/app/head";

import { routing } from "@/i18n/routing";

import "@arcgis/core/assets/esri/themes/light/main.css";
import "@/styles/globals.css";
import "@/styles/grid-layout.css";
import "react-resizable/css/styles.css";

type Params = Promise<{ locale: Locale }>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }));
}

const montserrat = Montserrat({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--montserrat",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <>
      <RootHead />
      <body className={`${montserrat.className}`}>
        <Suspense fallback={null}>
          <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
        </Suspense>
      </body>
    </>
  );
}
