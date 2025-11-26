import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ThirdParty from "@/containers/third-party";

import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }));
}

export default async function ReportLayout({ children }: LayoutProps<"/[locale]/report/[id]">) {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <FeedbackButton />

        <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
          {children}
        </main>
        <ThirdParty />
      </Suspense>
    </JotaiProvider>
  );
}
