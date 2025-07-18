import { Suspense } from "react";

import { Montserrat } from "next/font/google";

import { NextIntlClientProvider } from "next-intl";

const montserrat = Montserrat({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--montserrat",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body className={`${montserrat.className} w-full overflow-x-hidden`}>
        <Suspense fallback={null}>
          <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
