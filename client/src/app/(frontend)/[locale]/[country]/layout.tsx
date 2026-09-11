import { notFound } from "next/navigation";

import { isCountrySegment } from "@/lib/country";

/**
 * Anything outside the live set is a not-found, including a country that is configured
 * but not yet available. Redirecting to the Amazon Region instead would show regional
 * numbers under a URL the reader believes is national.
 *
 * `[locale]/not-found.tsx` is the boundary that catches this: a segment's own
 * `not-found.tsx` wraps its children rather than its layout.
 */
export default async function CountryLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[country]">) {
  const { country } = await params;

  if (!isCountrySegment(country)) {
    notFound();
  }

  return children;
}
