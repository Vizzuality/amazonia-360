import { atom } from "jotai";

import type { CountryCode } from "@/lib/country";

export const countryModuleDeactivatedAtom = atom<CountryCode | null>(null);
