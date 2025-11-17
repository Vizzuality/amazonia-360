"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Link } from "@/i18n/navigation";

export function CheckYourEmail(props: React.ComponentProps<"div">) {
  const t = useTranslations();

  return (
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">{t("auth-check-email-title")}</CardTitle>
        <CardDescription className="font-medium">
          {t("auth-check-email-description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/sign-in">
          <Button size="lg" className="w-full">
            {t("auth-link-back-to-sign-in")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
