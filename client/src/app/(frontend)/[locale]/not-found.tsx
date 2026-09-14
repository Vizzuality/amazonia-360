import { Suspense } from "react";

import { useTranslations } from "next-intl";

import Header from "@/containers/header";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

// Sits at the locale level rather than inside `(app)`, so that it also wraps the
// `[...rest]` catch-all — a segment's `not-found.tsx` catches what its children throw, not
// what its siblings do. It brings its own header because it no longer inherits `(app)`'s.
export default function Custom404() {
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
