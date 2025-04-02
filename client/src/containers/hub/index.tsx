"use client";

import ReactMarkdown from "react-markdown";

import Image from "next/image";
import Link from "next/link";

import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hub() {
  const t = useTranslations();
  return (
    <main className="relative flex w-full flex-col-reverse bg-blue-50 md:h-[calc(100svh_-_theme(space.40)_+_1px)] md:flex-row">
      <div className="container flex h-full py-12 md:py-0 md:pr-60">
        <div className="flex h-full w-full flex-col justify-center p-10 md:w-1/2">
          <h2 className="pb-6 text-2xl font-semibold text-blue-400 lg:text-3xl tall:xl:text-4xl">
            <ReactMarkdown>{t("hub-title")}</ReactMarkdown>
          </h2>
          <div className="flex flex-col space-y-2 pb-5 text-sm font-normal text-blue-900 tall:xl:pb-10 tall:xl:text-base">
            <p>
              <ReactMarkdown>{t("hub-intro-1")}</ReactMarkdown>
            </p>
            <p>{t("hub-intro-2")}</p>
          </div>
          <Link href="/report">
            <Button size="lg" className="flex space-x-2.5">
              <p>{t("hub-reporting-tool")}</p>
              <LuArrowRight size={20} strokeWidth={1} />
            </Button>
          </Link>
        </div>
      </div>
      <div className="w-full md:absolute md:right-0 md:top-0 md:h-full md:w-1/2">
        <Image
          src={"/images/hub/coming-soon.jpg"}
          alt={`${t("coming-soon")}...`}
          width={2000}
          height={2000}
          priority
          className="h-full w-full object-cover"
        />
      </div>
    </main>
  );
}
