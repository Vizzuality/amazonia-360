"use client";

import CountryModuleActivation from "./activation";
import CountryModuleBanner from "./banner";
import CountryModuleDialog from "./dialog";

export default function CountryModule() {
  return (
    <>
      <CountryModuleActivation />
      <CountryModuleDialog />
      <CountryModuleBanner />
    </>
  );
}
