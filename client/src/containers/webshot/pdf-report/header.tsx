"use client";

import { useMemo } from "react";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/(frontend)/store";

import { useRegisterPage } from "@/containers/webshot/pdf-report/hooks";

interface PdfHeaderProps {
  transparent?: boolean;
  title?: string;
  topic?: string;
  totalPages?: number;
  getCurrentPage?: (element?: HTMLElement) => number;
  documentHeight?: number;
}

export default function PdfHeader({ transparent, topic }: PdfHeaderProps) {
  const t = useTranslations();
  const [location] = useSyncLocation();

  // Generate a stable ID for this instance
  // Don't use crypto.randomUUID as headless chrome is going to break
  const id = useMemo(() => {
    return `pdf-header-${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const { currentPage, totalPages } = useRegisterPage(id);

  return (
    <header
      className={cn({
        "absolute left-0 top-0 box-border flex h-16 w-full shrink-0 flex-col justify-center px-14": true,
        "border-transparent bg-transparent": transparent,
        "border-b border-blue-50 bg-blue-50": !transparent,
        "after:absolute after:left-0 after:top-0 after:z-0 after:h-40 after:w-full after:bg-gradient-to-b after:from-black/50 after:to-transparent":
          transparent,
      })}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="z-[120] flex items-center space-x-2">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Image
              src={transparent ? "/IDB-logo-white.svg" : "/IDB-logo.svg"}
              alt="IDB"
              width={65}
              height={24}
              priority
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
        </div>

        <div>
          <p
            className={cn({
              "text-white": transparent,
              "text-black": !transparent,
              "text-xs": true,
            })}
          >
            {location?.custom_title || t("selected-area")}

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
            {currentPage} / {totalPages}
          </p>
        </div>
      </div>
    </header>
  );
}
