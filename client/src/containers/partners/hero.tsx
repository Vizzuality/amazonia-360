import { useTranslations } from "next-intl";

export default function PartnersHero() {
  const t = useTranslations();

  return (
    <section
      data-testid="partners-hero"
      className="flex items-center bg-blue-700 py-12 text-blue-50 lg:h-[420px]"
    >
      <div className="container">
        <div className="flex max-w-[736px] flex-col gap-4">
          <h1 className="text-[48px] leading-14 font-bold">{t("partners-hero-title")}</h1>
          <p className="text-[18px] leading-7 font-medium">{t("partners-hero-description")}</p>
        </div>
      </div>
    </section>
  );
}
