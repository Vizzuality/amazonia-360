"use client";

import { isFeatureEnabled } from "@/lib/feature-flags";

import CountryModuleActivation from "./activation";
import CountryModuleBanner from "./banner";
import CountryModuleDialog from "./dialog";

export default function CountryModule() {
  if (!isFeatureEnabled("country-module")) return null;

  return (
    <>
      <CountryModuleActivation />
      <CountryModuleDialog />
      <CountryModuleBanner />
    </>
  );
}
