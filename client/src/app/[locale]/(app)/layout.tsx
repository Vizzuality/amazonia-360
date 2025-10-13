import { Suspense } from "react";

import { Metadata } from "next";

import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { hasLocale, Locale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import RootHead from "@/app/head";

import Header from "@/containers/header";
import ThirdParty from "@/containers/third-party";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-app-layout-title"),
    description: t("metadata-app-layout-description"),
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon" },
        { url: "/icon.png", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png" }],
      other: [
        { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
  };
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
      <body className={`${montserrat.className} w-full overflow-x-hidden`}>
        <Toaster position="top-right" richColors />

        <Suspense fallback={null}>
          <NextIntlClientProvider locale={locale}>
            <SidebarProvider>
              <Header />
              {children}
              <ThirdParty />
            </SidebarProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </>
  );
}
