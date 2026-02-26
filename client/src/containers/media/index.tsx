import { createMedia } from "@artsy/fresnel";

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1260,
  "2xl": 1660,
  "3xl": 1900,
};

const ExampleAppMedia = createMedia({ breakpoints });

// Make styles for injection into the header of the page
export const mediaStyles = ExampleAppMedia.createMediaStyle();

export const { Media, MediaContextProvider } = ExampleAppMedia;
