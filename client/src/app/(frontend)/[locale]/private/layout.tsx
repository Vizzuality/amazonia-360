import { Suspense } from "react";

import { Metadata } from "next";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";

import Header from "@/containers/header";

import { Toaster } from "@/components/ui/sonner";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
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

  const session = await auth();

  if (!session) {
    const headersList = await headers();
    const currentUrl = headersList.get("x-current-path") || "";

    redirect({
      locale,
      href: `/auth/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`,
    });
  }

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
