"use client";

import { useInView } from "react-intersection-observer";
import ReactMarkdown from "react-markdown";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

// import { Button } from "@/components/ui/button";

const Partner = ({
  href,
  src,
  alt,
  className,
  width,
  height,
}: {
  href: string;
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}) => (
  <li className={cn(`relative flex items-center ${className}`)}>
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex h-full w-full items-center justify-center"
      href={href}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn("h-full max-h-20 w-auto object-contain", {
          "max-h-32": alt === "ACTO ARO",
        })}
      />
    </a>
  </li>
);

const PARTNERS = [
  {
    href: "https://oraotca.org/",
    src: "/partners/atco-en.avif",
    alt: "ACTO ARO",
    className: "p-1 w-full",
    width: 621,
    height: 192,
  },
  {
    href: "https://www.iadb.org",
    src: "/partners/idb-atlas.avif",
    alt: "IDB Atlas",
    className: "p-1 -top-4",
    width: 701,
    height: 192,
  },
  {
    href: "https://datapartnership.org/",
    src: "/partners/ddp.avif",
    alt: "Data Digital Partnership",
    className: "p-1 -top-4",
    width: 420,
    height: 192,
  },
  {
    href: "https://www.greenclimate.fund/",
    src: "/partners/green-climate-fund.avif",
    alt: "Green Climate Fund",
    className: "p-1 -top-4",
    width: 331,
    height: 192,
  },
  {
    href: "https://www.esri.com/",
    src: "/partners/esri.avif",
    alt: "Esri",
    className: "p-1 -top-4",
    width: 239,
    height: 192,
  },
  {
    href: "https://vizzuality.com",
    src: "/partners/vizzuality.avif",
    alt: "Vizzuality",
    className: "p-1 -top-4",
    width: 500,
    height: 192,
  },
];
export default function Partners() {
  const t = useTranslations();

  const { ref: sectionRef, inView: isSectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <section ref={sectionRef} className="bg-blue-50 py-20 md:py-28">
      <div className="container flex flex-col items-end md:flex-row md:items-center md:space-x-28">
        <div
          className={`flex w-full flex-col space-y-5 md:w-1/2 md:space-y-6 ${isSectionInView ? "md:animate-in md:fade-in-0 md:slide-in-from-left-20 overflow-hidden md:duration-700" : "md:opacity-0"}`}
        >
          <div>
            <h3 className="tracking-wide-lg text-sm font-extrabold text-blue-400 uppercase">
              {t("landing-partners-note")}
            </h3>
            <h2 className="max-w-44 pb-6 text-2xl text-blue-600 md:max-w-[390px] lg:text-3xl xl:text-4xl">
              {t("landing-partners-title")}
            </h2>
            <div className="text-base font-normal text-blue-900 lg:text-lg">
              <ReactMarkdown>{t("landing-partners-description")}</ReactMarkdown>
            </div>
          </div>
          {/* <Button size="lg" className="flex max-w-[200px] px-8">
            Become a partner!
          </Button> */}
        </div>
        <div
          className={`mt-10 flex w-full flex-col space-y-4 md:mt-0 md:w-1/2 ${isSectionInView ? "md:animate-in md:fade-in-0 md:slide-in-from-right-20 overflow-hidden md:duration-700" : "opacity-0"}`}
        >
          <ul className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-4 xl:gap-x-4">
            {PARTNERS.map((partner, index) => (
              <Partner {...partner} key={`partner-${index}`} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
