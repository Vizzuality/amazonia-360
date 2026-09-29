"use client";

import ModuleList from "./module-list";
import { useCountryOptions } from "./options";

export default function MobileCountrySelector({ onSelect }: Readonly<{ onSelect: () => void }>) {
  const options = useCountryOptions();

  if (!options) return null;

  return (
    <ModuleList options={options} onSelect={onSelect} variant="inline" className="px-6 py-4" />
  );
}
