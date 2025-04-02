import { useTranslations } from "next-intl";

export default function FeedbackButton() {
  const t = useTranslations();
  return (
    <div className="fixed right-0 top-1/2 hidden -translate-y-1/2 lg:block print:hidden">
      <a
        href="https://survey123.arcgis.com/share/fadbaa4e81f04f068f5ed0abd99e4789"
        target="_blank"
        className="group z-50 block origin-bottom-right -translate-y-28 -rotate-90 rounded-t-lg bg-blue-500 px-4 py-1 text-white shadow-lg transition-all duration-200 ease-in-out hover:bg-blue-600 hover:shadow-xl"
      >
        <span className="block transition-all duration-200 ease-in-out group-hover:translate-x-1">
          {t("feedback")}
        </span>
      </a>
    </div>
  );
}
