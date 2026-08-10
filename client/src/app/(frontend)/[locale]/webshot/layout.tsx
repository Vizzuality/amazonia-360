import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";
import { Locale } from "next-intl";

import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function WebshotLayout({
  children,
  params,
}: LayoutProps<"/[locale]/webshot">) {
  const { locale } = await params;
  await requireUser(locale as Locale);

  return (
    <JotaiProvider>
      <Suspense fallback={null}>{children}</Suspense>
    </JotaiProvider>
  );
}
