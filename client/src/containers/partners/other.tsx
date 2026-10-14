"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { getPartnerRows } from "@/lib/country/partners";
import { getRegionalPartners, useGetPartners } from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

function getTitleKey(): "partners-other-title" | "partners-regional-title" {
  return isFeatureEnabled("country-module") ? "partners-other-title" : "partners-regional-title";
}

export default function OtherPartners() {
  const t = useTranslations();
  const partners = useGetPartners();
  const rows = getPartnerRows(getRegionalPartners(partners));

  if (!rows.length) return null;

  return (
    <section data-testid="partners-other" className="bg-white py-20">
      <div className="container flex flex-col items-center gap-8 lg:flex-row lg:justify-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-2xl leading-[normal] font-bold">
            {t(getTitleKey())}
          </h2>
          <p className="text-muted-foreground text-sm leading-[normal] font-medium">
            {t("partners-other-description")}
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-10 lg:w-[606px]">
          {rows.map((row) => (
            <ul key={row[0].id} className="flex flex-wrap items-center justify-center gap-10">
              {row.map((partner) => (
                <li key={partner.id} className="flex items-center">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={400}
                    height={160}
                    className={cn(
                      "h-20 w-auto object-contain",
                      partner.logoSize === "large" && "h-[72px]",
                    )}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
