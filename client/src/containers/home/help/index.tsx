"use client";

import dynamic from "next/dynamic";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { LuMessagesSquare, LuTabletSmartphone } from "react-icons/lu";

import { FEEDBACK_URL } from "@/containers/home/constants";

import { Button } from "@/components/ui/button";

const QRCodeHelp = dynamic(() => import("./qr-code"), { ssr: false });

export default function Help() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="bg-blue-700 text-white">
      <div className="container py-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 flex flex-col items-start justify-between lg:col-span-5 lg:py-16">
            <div className="flex flex-col justify-start space-y-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-500 p-4 text-cyan-500">
                <LuMessagesSquare className="size-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold">{t("landing-help-title")}</h3>
                <p className="max-w-2xl font-normal">{t("landing-help-description")}</p>
              </div>

              <a href={`${FEEDBACK_URL}?lang=${locale}`} target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="hover:text-accent">
                  {t("landing-help-give-feedback")}
                </Button>
              </a>
            </div>
          </div>

          <div className="col-span-12 hidden items-start justify-between lg:col-span-5 lg:col-start-8 lg:flex lg:gap-6 lg:py-16">
            <div className="flex flex-col justify-start space-y-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-500 p-4 text-cyan-500">
                <LuTabletSmartphone className="size-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold">{t("landing-help-title-2")}</h3>
                <p className="max-w-2xl font-normal">{t("landing-help-description-2")}</p>
              </div>
            </div>

            <div className="mt-20">
              <QRCodeHelp />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
