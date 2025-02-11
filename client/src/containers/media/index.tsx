import { createMedia } from "@artsy/fresnel";
import resolveConfig from "tailwindcss/resolveConfig";

import TAILWIND_CONFIG from "@/../tailwind.config";

const config = resolveConfig(TAILWIND_CONFIG);
const SCREENS_KEYS = Object.keys(config.theme.screens) as Array<keyof typeof config.theme.screens>;
const screens = SCREENS_KEYS.filter((k) => k !== "tall").reduce((acc, key) => {
  return {
    ...acc,
    [key]: parseInt(config.theme.screens[`${key}`], 10),
  };
}, {});

const ExampleAppMedia = createMedia({
  breakpoints: {
    xs: 0,
    ...screens,
  } as Record<"xs" | keyof typeof config.theme.screens, number>,
});

// Make styles for injection into the header of the page
export const mediaStyles = ExampleAppMedia.createMediaStyle();

export const { Media, MediaContextProvider } = ExampleAppMedia;
