import { Suspense } from "react";

import { Metadata } from "next";

import { notFound } from "next/navigation";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/auth/require-user";

import Header from "@/containers/header";

import { Toaster } from "@/components/ui/sonner";

import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]/private">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale });

  return {
    title: t("metadata-my-reports-layout-title"),
    description: t("metadata-my-reports-layout-description"),
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

export default async function PrivateLayout({
  children,
  params,
}: LayoutProps<"/[locale]/private">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  await requireUser(locale);

  return (
    <>
      <Toaster position="top-center" richColors />

      <Suspense fallback={null}>
        <Header />
        {children}
      </Suspense>
    </>
  );
}
