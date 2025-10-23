import { Suspense } from "react";

import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import RootHead from "@/app/(frontend)/head";

import { SidebarProvider } from "@/components/ui/sidebar";

import { routing } from "@/i18n/routing";

import "@arcgis/core/assets/esri/themes/light/main.css";
import "@/styles/globals.css";
import "@/styles/grid-layout.css";
import "react-resizable/css/styles.css";

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

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]/webshot">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <>
      <RootHead />
      <body className={`${montserrat.className} bg-gray-500`}>
        <Suspense fallback={null}>
          <SidebarProvider>
            <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
          </SidebarProvider>
        </Suspense>
      </body>
    </>
  );
}
