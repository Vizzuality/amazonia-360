"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Link } from "@/i18n/navigation";

import { ComingSoonBadge } from "./coming-soon";
import { moduleSwitchHandler } from "./module-switch";
import { useCountryOptions } from "./options";

/**
 * The choice inside the hamburger dialog, as a plain list of links — the same shape the
 * language selector already uses there. No popover below `md`.
 *
 * `onSelected` closes the menu: choosing a module does not navigate, so nothing remounts
 * the dialog out from under the choice.
 */
const MobileCountrySelector = ({ onSelected }: { onSelected: () => void }) => {
  const t = useTranslations();
  const options = useCountryOptions();
  const onSelect = moduleSwitchHandler(onSelected);

  if (!options) return null;

  return (
    <>
      <p className="text-muted-foreground px-6 pt-4 text-xs font-semibold tracking-wide uppercase">
        {t("country-module-selector-label")}
      </p>

      {options.map((option) =>
        option.href ? (
          <Link
            key={option.segment}
            href={option.href}
            onClick={onSelect}
            aria-current={option.active ? "page" : undefined}
            className={cn({
              "px-6 py-4 text-lg text-blue-900 hover:bg-blue-200 hover:text-blue-500": true,
              "text-blue-500": option.active,
            })}
          >
            {option.name}
          </Link>
        ) : (
          <span
            key={option.segment}
            aria-disabled
            className="flex items-center gap-2 px-6 py-4 text-lg text-blue-900 opacity-60"
          >
            <span>{option.name}</span>
            <ComingSoonBadge />
          </span>
        ),
      )}
    </>
  );
};

export default MobileCountrySelector;
