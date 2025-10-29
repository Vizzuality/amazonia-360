import { Suspense } from "react";

import { Metadata } from "next";

import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import RootHead from "@/app/(frontend)/head";

import Header from "@/containers/header";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

import { routing } from "@/i18n/routing";

import "@arcgis/core/assets/esri/themes/light/main.css";
import "@/styles/globals.css";
import "@/styles/grid-layout.css";
import "react-resizable/css/styles.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale });

  return {
    title: t("metadata-my-area-layout-title"),
    description: t("metadata-my-area-layout-description"),
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
  };
}

const montserrat = Montserrat({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--montserrat",
});

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <>
      <RootHead />
      <body className={`${montserrat.className} w-full overflow-x-hidden`}>
        <Toaster position="top-center" richColors />

        <Suspense fallback={null}>
          <SidebarProvider>
            <NextIntlClientProvider locale={locale}>
              <Header />
              {children}
            </NextIntlClientProvider>
          </SidebarProvider>
        </Suspense>
      </body>
    </>
  );
}
