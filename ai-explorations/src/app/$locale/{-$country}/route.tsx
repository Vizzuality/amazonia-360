import { Suspense } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { useTranslations } from "use-intl";

import { getActiveModuleSlugs, getCountryModulesQueryOptions } from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { notFound } from "@/lib/navigation";

import Header from "@/containers/header";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

// Mirrors the client's `proxy.ts` rewrite: every route under the locale accepts a live slug.
export const Route = createFileRoute("/$locale/{-$country}")({
  beforeLoad: async ({ params: { country }, context: { locale, queryClient } }) => {
    if (country === undefined) return;
    if (!isFeatureEnabled("country-module")) notFound();

    const modules = await queryClient.ensureQueryData(getCountryModulesQueryOptions(locale));
    if (!getActiveModuleSlugs(modules).includes(country)) notFound();
  },
  component: Outlet,
  notFoundComponent: Custom404,
});

function Custom404() {
  const t = useTranslations();

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <div className="text-blue-ocean flex h-[calc(100svh-calc(var(--spacing)*40)+1px)] w-screen flex-col items-center justify-center bg-white">
        <div className="max-w-140.25 space-y-5 text-center">
          <h1 className="text-bold text-xl">{t("not-found-page-title")}</h1>
          <p className="text-large">{t("not-found-page-message")}</p>
          <div>
            <Link href="/">
              <Button>{t("go-back-home-button")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
