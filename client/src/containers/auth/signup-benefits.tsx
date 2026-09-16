"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const BENEFIT_KEYS = [
  "auth-signup-benefit-reports",
  "auth-signup-benefit-summaries",
  "auth-signup-benefit-community",
] as const;

export function SignupBenefits({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations();

  return (
    <div className={cn("flex flex-col gap-6 bg-blue-700 px-10 py-18", className)} {...props}>
      <p className="text-[32px] leading-[32px] font-medium text-white">
        {t("auth-signup-benefits-title")}
      </p>
      <ul className="flex flex-col">
        {BENEFIT_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2 px-2 py-1">
            <Check className="size-6 shrink-0 text-cyan-500" aria-hidden="true" />
            <span className="text-base font-medium text-white">{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
