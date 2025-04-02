"use client";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function Help() {
  const t = useTranslations();
  return (
    <section className="bg-blue-700 text-white">
      <div className="container py-10">
        <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center lg:py-16">
          <div className="flex flex-col justify-start md:py-0 md:pt-16">
            <h3 className="text-lg font-bold">{t("landing-help-title")}</h3>
            <p className="max-w-2xl font-normal">{t("landing-help-description")}</p>
          </div>
          <div className="flex flex-col items-center md:items-center md:pt-8 lg:pt-16">
            <a
              href="https://survey123.arcgis.com/share/fadbaa4e81f04f068f5ed0abd99e4789"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="secondary" className="mt-4">
                {t("landing-help-give-feedback")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
