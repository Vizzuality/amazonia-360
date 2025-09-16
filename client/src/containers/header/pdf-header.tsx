"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

interface PdfHeaderProps {
  transparent?: boolean;
  pageNumber?: number;
  totalPages?: number;
  title?: string;
  topic?: string;
}

export default function PdfHeader({
  transparent,
  pageNumber,
  totalPages,
  title,
  topic,
}: PdfHeaderProps) {
  const t = useTranslations();

  return (
    <header
      className={cn({
        "box-border flex h-16 flex-col justify-center": true,
        "border-transparent bg-transparent": transparent,
        "border-b border-blue-50 bg-white": !transparent,
      })}
    >
      <div className="container flex items-center justify-between md:mx-auto">
        {/* Logo section - simplified without link functionality */}
        <div className="z-[120] flex items-center space-x-2">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Image
              src={transparent ? "/IDB-logo-white.svg" : "/IDB-logo.svg"}
              alt="IDB"
              width={65}
              height={24}
            />
            <div className="space-x-2">
              <span
                className={cn({
                  "text-xs font-medium lg:text-sm": true,
                  "text-white": transparent,
                  "text-blue-500": !transparent,
                })}
              >
                AmazoniaForever360+
              </span>
            </div>
          </div>
          <Badge className="text-xs lg:text-sm" variant="secondary">
            Beta
          </Badge>
        </div>

        <div>
          <p className={cn({ "text-white": transparent, "text-black": !transparent })}>
            {t("pdf-report-cover-title", { location: title || "Selected Area" })}
            {!!topic ? <span className="font-thin"> | {topic}</span> : ""}
          </p>
        </div>
        {/* Right side - empty for PDF version, no language selector or other functionality */}

        <div
          className={cn({
            "flex items-center justify-between": true,
            "text-white": transparent,
            "text-black": !transparent,
          })}
        >
          <p>
            {pageNumber} / {totalPages}
          </p>
        </div>
      </div>
    </header>
  );
}
