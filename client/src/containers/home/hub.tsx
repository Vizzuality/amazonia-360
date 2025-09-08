import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function Hub() {
  const t = useTranslations();
  return (
    <section
      className="bg-center py-20 text-white sm:py-28"
      style={{
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/hub.jpeg') lightgray 50% / cover no-repeat",
      }}
    >
      <div className="container">
        <div className="flex max-w-xl flex-col items-start justify-start space-y-8">
          <h3 className="text-2xl font-bold">{t("landing-hub-key")}</h3>
          <p className="max-w-lg font-normal">{t("landing-hub-title")}</p>
          <Link href="/report/indicators">
            <Button size="lg" variant="secondary" className="flex space-x-2.5">
              <p> {t("landing-hub-access-hub")}</p>
              <LuArrowRight size={20} strokeWidth={1} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
