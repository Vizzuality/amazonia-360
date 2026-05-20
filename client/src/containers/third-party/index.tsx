"use client";

import React, { useMemo } from "react";

import useCookie from "react-use-cookie";

import { GoogleTagManager } from "@next/third-parties/google";
import { useTranslations } from "next-intl";

import { env } from "@/env.mjs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Markdown } from "@/components/ui/markdown";

// import Cookies from "components/cookies";

const ThirdParty: React.FC = () => {
  const t = useTranslations();
  const [consentCookie, setConsentCookie] = useCookie("consent", undefined);

  const consent = useMemo(() => {
    if (consentCookie === "true") return true;
    if (consentCookie === "false") return false;
    return undefined;
  }, [consentCookie]);

  const handleCookieClick = (c: boolean) => {
    setConsentCookie(String(c));
  };

  return (
    <>
      {consent && env.NEXT_PUBLIC_GTM_ID && <GoogleTagManager gtmId={env.NEXT_PUBLIC_GTM_ID} />}

      <Dialog open={consent === undefined}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="text-2xl">{t("content-title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("consent-message")}</DialogDescription>
          <Markdown>{t("consent-message")}</Markdown>
          <DialogFooter className="mt-5 justify-end">
            <Button
              size="lg"
              onClick={() => {
                handleCookieClick(true);
              }}
            >
              {t("accept")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                handleCookieClick(false);
              }}
            >
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ThirdParty;
