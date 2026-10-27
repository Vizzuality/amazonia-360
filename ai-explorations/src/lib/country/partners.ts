import type { Partner } from "@/lib/country-modules";

const ROW_PATTERN = [1, 2, 2, 1] as const;

export function getPartnersHref(slug: string | null): {
  pathname: string;
  query?: { country: string };
} {
  return slug ? { pathname: "/partners", query: { country: slug } } : { pathname: "/partners" };
}

export function getPartnerRows(partners: readonly Partner[]): Partner[][] {
  const rows: Partner[][] = [];
  let index = 0;
  while (index < partners.length) {
    const size = ROW_PATTERN[rows.length % ROW_PATTERN.length];
    rows.push(partners.slice(index, index + size));
    index += size;
  }
  return rows;
}
