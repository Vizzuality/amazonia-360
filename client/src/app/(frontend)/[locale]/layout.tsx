import { Metadata } from "next";

import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";

import { auth } from "@/lib/auth";

import RootHead from "@/app/(frontend)/head";
import LayoutProviders from "@/app/(frontend)/layout-providers";

import { SidebarProvider } from "@/components/ui/sidebar";

import { routing } from "@/i18n/routing";

import "@arcgis/core/assets/esri/themes/light/main.css";
import "@mdxeditor/editor/style.css";
import "@/styles/globals.css";
import "@/styles/grid-layout.css";
import "react-resizable/css/styles.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
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

  // Enable static rendering
  setRequestLocale(locale);

  const session = await auth();

  return (
    <LayoutProviders locale={locale} session={session}>
      <html lang={locale}>
        <RootHead />

        <body className={`${montserrat.className} w-full overflow-x-hidden`}>
          <Toaster position="top-center" richColors />
          <SidebarProvider>
            <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
          </SidebarProvider>
        </body>
      </html>
    </LayoutProviders>
  );
}
