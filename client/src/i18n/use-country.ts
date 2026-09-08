"use client";

import { useParams } from "next/navigation";

import { AMAZON_REGION } from "@/lib/country";

/**
 * The active country, read from the route param. Unscoped routes (`auth`, `private`,
 * `webshot`) have no param, so they read as the Amazon Region — which is why a round
 * trip through them loses the selection.
 */
export function useCountry(): string {
  const params = useParams();
  const country = params?.country;
  return typeof country === "string" ? country : AMAZON_REGION;
}
