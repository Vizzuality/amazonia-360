import { notFound } from "next/navigation";

/**
 * Every path under a locale that matches no real route, turned into a thrown `notFound()`
 * so `[locale]/not-found.tsx` renders it — translated, with the header, in the reader's
 * locale. Without this the miss would be Next's unstyled built-in 404: a nested
 * `not-found.tsx` only catches a thrown `notFound()`, and an unmatched URL is the root
 * `app/not-found.tsx`'s business, which cannot know the locale.
 *
 * This is also what answers a country module that does not exist. `proxy.ts` strips a live
 * code before Next routes the request and leaves anything else in place, so `/en/SUR` and
 * `/en/XYZ` arrive here with the typed code still in the address bar.
 */
export default function CatchAllNotFound() {
  notFound();
}
