"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

interface PdfHeaderProps {
  transparent?: boolean;
  title?: string;
  topic?: string;
  totalPages?: number;
  getCurrentPage?: (element?: HTMLElement) => number;
  documentHeight?: number;
}

export default function PdfHeader({
  transparent,
  title,
  topic,
  totalPages = 0,
  getCurrentPage,
  documentHeight = 0,
}: PdfHeaderProps) {
  const t = useTranslations();
  const headerRef = useRef<HTMLElement>(null);
  const [actualPageNumber, setActualPageNumber] = useState(1);

  // Update page number whenever document height changes or component mounts
  useEffect(() => {
    const updatePageNumber = () => {
      if (headerRef.current && getCurrentPage) {
        const pageNumber = getCurrentPage(headerRef.current);
        setActualPageNumber(pageNumber);
      }
    };

    // Update immediately
    updatePageNumber();

    // Also update after a small delay to ensure DOM is fully updated
    const timeoutId = setTimeout(updatePageNumber, 200);

    return () => clearTimeout(timeoutId);
  }, [documentHeight, totalPages, getCurrentPage]);

  return (
    <header
      ref={headerRef}
      className={cn({
        "absolute left-0 top-0 box-border flex h-16 w-full shrink-0 flex-col justify-center": true,
        "border-transparent bg-transparent": transparent,
        "border-b border-blue-50 bg-white": !transparent,
      })}
    >
      <div className="container flex items-center justify-between md:mx-auto">
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

        <div
          className={cn({
            "flex items-center justify-between": true,
            "text-white": transparent,
            "text-black": !transparent,
          })}
        >
          <p>
            {actualPageNumber} / {totalPages}
          </p>
        </div>
      </div>
    </header>
  );
}
