import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";

import { getOtherPartnerLogoRows } from "@/lib/country/partners";
import { cn } from "@/lib/utils";

export default function OtherPartners() {
  const t = useTranslations();
  const locale = useLocale();
  const rows = getOtherPartnerLogoRows(locale);

  return (
    <section data-testid="partners-other" className="bg-white py-20">
      <div className="container flex flex-col items-center gap-8 lg:flex-row lg:justify-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-2xl font-bold">{t("partners-other-title")}</h2>
          <p className="text-muted-foreground text-sm font-medium">
            {t("partners-other-description")}
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-10 lg:w-[606px]">
          {rows.map((row) => (
            <ul key={row[0].src} className="flex flex-wrap items-center justify-center gap-10">
              {row.map((logo) => (
                <li key={logo.src} className="flex items-center">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={400}
                    height={160}
                    className={cn("h-20 w-auto object-contain", {
                      "h-[72px]": logo.alt === "Green Climate Fund",
                    })}
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
