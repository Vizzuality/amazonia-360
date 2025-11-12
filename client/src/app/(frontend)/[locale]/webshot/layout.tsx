import { Suspense } from "react";

export default async function WebshotLayout({ children }: LayoutProps<"/[locale]/webshot">) {
  return (
    <>
      <Suspense fallback={null}>{children}</Suspense>
    </>
  );
}
