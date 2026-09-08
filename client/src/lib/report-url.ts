import { AMAZON_REGION } from "@/lib/country";

/**
 * The link we hand out for a report. Always the Amazon Region: under view-state
 * semantics a country segment would promise the recipient a view they will not get, and
 * every report that exists today genuinely is regional. When reports gain a country of
 * their own this is the one place that changes.
 *
 * Empty on the server — it reads the origin from the browser.
 */
export function reportShareUrl(locale: string, reportId: string | number): string {
  if (typeof window === "undefined") return "";

  return `${window.location.origin}/${locale}/${AMAZON_REGION}/reports/${reportId}`;
}
