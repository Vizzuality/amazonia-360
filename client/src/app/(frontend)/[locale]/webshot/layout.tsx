import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";

export default async function WebshotLayout({ children }: LayoutProps<"/[locale]/webshot">) {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>{children}</Suspense>
    </JotaiProvider>
  );
}
