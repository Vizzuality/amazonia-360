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
}: {
  href: string;
  src: string;
  alt: string;
  className?: string;
}) => (
  <li className={cn(`flex h-16 items-center ${className}`)}>
    <a target="_blank" rel="noopener noreferrer" className="relative h-full w-full" href={href}>
      <Image src={src} alt={alt} fill className="object-contain" />
    </a>
  </li>
);

const PARTNERS = [
  {
    href: "https://datapartnership.org/",
    src: "/partners/ddp.avif",
    alt: "Data Digital Partnership",
  },
  {
    href: "https://oraotca.org/",
    src: "/partners/atco-en.avif",
    alt: "ACTO ARO",
  },
  {
    href: "https://www.esri.com/",
    src: "/partners/esri.avif",
    alt: "Esri",
    className: "p-1",
  },
  {
    href: "https://www.greenclimate.fund/",
    src: "/partners/green-climate-fund.avif",
    alt: "Green Climate Fund",
  },
  {
    href: "https://www.iadb.org",
    src: "/partners/idb-atlas.avif",
    alt: "IDB Atlas",
    className: "p-1",
  },
  {
    href: "https://vizzuality.com",
    src: "/partners/vizzuality.avif",
    alt: "Vizzuality",
    className: "p-1",
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
          className={`flex w-full flex-col space-y-5 md:w-1/2 md:space-y-6 ${isSectionInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-20" : "md:opacity-0"}`}
        >
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
              {t("landing-partners-note")}
            </h3>
            <h2 className="max-w-44 pb-6 text-2xl text-blue-400 md:max-w-[390px] lg:text-3xl xl:text-4xl">
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
          className={`mt-10 flex w-full flex-col space-y-4 md:mt-0 md:w-1/2 ${isSectionInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-right-20" : "opacity-0"}`}
        >
          <ul className="grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3">
            {PARTNERS.map((partner, index) => (
              <Partner {...partner} key={`partner-${index}`} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
