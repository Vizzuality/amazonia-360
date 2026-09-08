import { Suspense } from "react";

import Image from "next/image";
import { notFound } from "next/navigation";

import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import Header from "@/containers/header";
import ThirdParty from "@/containers/third-party";

import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Authentication routes carry no country module: "which country is this password reset
// in" has no answer. The static `auth` segment beats the dynamic `[country]` one, so
// these resolve unprefixed, outside the layout that gives the home page its chrome.
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]/auth">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <Header />

      <main className="relative flex lg:min-h-[calc(100svh-calc(var(--spacing)*16))]">
        <div className="container flex grow flex-col pt-20 lg:min-h-[calc(100svh-calc(var(--spacing)*16))] lg:pt-16">
          <div className="grid grow grid-cols-12">
            <div className="col-span-12 flex grow flex-col lg:col-span-8">{children}</div>
          </div>
        </div>

        <div className="absolute top-0 right-0 hidden h-full w-1/3 lg:block print:hidden">
          <Image
            src="/images/auth/auth.webp"
            alt="Authentication background"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </main>

      <ThirdParty />
    </Suspense>
  );
}
