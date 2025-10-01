import ReactMarkdown from "react-markdown";

import { useTranslations } from "next-intl";

import Topics from "@/containers/home/topics";

export default function InformationOn() {
  const t = useTranslations();
  return (
    <section className="bg-blue-700">
      <div className="container flex flex-col space-y-2 pt-20 md:space-y-0 md:pt-28">
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          {t("landing-information-on-note")}
        </h3>
        <div className="flex w-full flex-col justify-between md:grid md:grid-cols-2 md:gap-14">
          <h2 className="text-2xl text-white lg:text-4xl">
            <ReactMarkdown>{t("landing-information-on-title")}</ReactMarkdown>
          </h2>
          <p className="text-base font-normal text-white lg:text-lg">
            {t("landing-information-on-description")}
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1900px]">
        <Topics />
      </div>
    </section>
  );
}
