import type { TextFieldValidation } from "payload";

import { routing } from "@/i18n/routing";

/**
 * Requires a value in the default locale only, leaving translations optional.
 *
 * Marking a localized field plainly `required` makes it impossible to save a
 * record while a non-default locale is active unless a translation is supplied
 * for that locale — verified against Payload 3.79 (AM-666): the save is
 * rejected with "The following field is invalid: Name".
 *
 * That matters because translations are stored sparsely here: a locale is
 * written only when it genuinely differs from English. Several Subtopics have no
 * Spanish name at all. With a plain `required`, an editor working in Spanish on
 * one of those records is forced either to invent a translation or to let the
 * form submit the inherited English back — and saving the inherited value does
 * persist it into that locale, which is how sparse translations erode one edit
 * at a time.
 */
export const requiredInDefaultLocale =
  (label: string): TextFieldValidation =>
  (value, { req }) => {
    const locale = req?.locale;

    // Only the default locale must carry a value; everything else falls back.
    if (locale && locale !== routing.defaultLocale && locale !== "all") {
      return true;
    }

    if (typeof value === "string" && value.trim() !== "") {
      return true;
    }

    return `${label} is required in ${routing.defaultLocale}.`;
  };
