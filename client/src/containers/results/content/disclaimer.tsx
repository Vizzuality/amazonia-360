"use client";

import Markdown from "react-markdown";

import { useSearchParams } from "next/navigation";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { Link, usePathname } from "@/i18n/navigation";

export default function ReportResultsDisclaimer() {
  const t = useTranslations();
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAnonymous = !session?.user || session.user.collection === "anonymous-users";
  const currentUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const signInHref = `/auth/sign-in?redirectUrl=${encodeURIComponent(currentUrl)}`;

  if (!isAnonymous) return null;

  return (
    <div className="container">
      <div className="flex flex-col gap-4 rounded-md border border-border bg-orange-50 px-4 py-3">
        <Markdown className="text-normal mt-2 text-foreground 2xl:text-lg">
          {t("report-results-anonymous-disclaimer")}
        </Markdown>
        <div className="flex shrink-0">
          <Link href={signInHref}>
            <Button variant="outline" size="responsive">
              {t("auth-sign-in")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
