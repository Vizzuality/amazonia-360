import { notFound } from "next/navigation";

// A nested `not-found.tsx` only catches a thrown `notFound()`, so an unmatched URL needs
// this to reach the translated 404 instead of Next's unstyled built-in one.
export default function CatchAllNotFound() {
  notFound();
}
