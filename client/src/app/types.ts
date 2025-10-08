import type { SearchParams } from "nuqs/server";
export interface PageProps<Params> {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}
