import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function Custom404() {
  const t = useTranslations();
  return (
    <div className="text-blue-ocean flex h-[calc(100svh_-_theme(space.40)_+_1px)] w-screen flex-col items-center justify-center bg-white">
      <div className="max-w-[561px] space-y-5 text-center">
        <h1 className="text-bold text-xl">{t("not-found-page-title")}</h1>
        <p className="text-large">{"not-found-page-message"}</p>
        <div>
          <Link href="/">
            <Button>{t("go-back-home-button")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
