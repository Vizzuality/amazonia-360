"use client";

import { useInView } from "react-intersection-observer";
import ReactMarkdown from "react-markdown";

import Image from "next/image";

import { useTranslations } from "next-intl";

const Partner = ({
  href,
  src,
  alt,
  w = 64,
  h = 25,
}: {
  href: string;
  src: string;
  alt: string;
  w?: number;
  h?: number;
}) => (
  <li className="flex h-20 items-center justify-center">
    <a target="_blank" rel="noopener noreferrer" href={href}>
      <Image src={src} alt={alt} width={w} height={h} />
    </a>
  </li>
);

const PARTNERS = [
  {
    href: "https://www.google.com",
    src: "/partners/google.svg",
    alt: "Google",
  },
  {
    href: "https://www.meta.com",
    src: "/partners/meta.svg",
    alt: "Meta",
  },
  {
    href: "https://vizzuality.com",
    src: "/partners/vizzuality.svg",
    alt: "Vizzuality",
  },
  {
    href: "https://oraotca.org/",
    src: "/partners/acto.svg",
    alt: "ACTO ARO",
  },
  {
    href: "https://www.ookla.com/",
    src: "/partners/ookla.svg",
    alt: "Ookla",
  },
  {
    href: "https://esa.int/",
    src: "/partners/esa.png",
    alt: "European Space Agency (ESA)",
  },
  {
    href: "https://www.esri.com/",
    src: "/partners/esri.png",
    alt: "Esri",
  },
  {
    href: "https://raisd-h2020.eu/",
    src: "/partners/raisg.svg",
    alt: "RAiSG",
  },
  {
    href: "https://leica-geosystems.com/",
    src: "/partners/leica.svg",
    alt: "Leica Geosystems AG",
  },
  {
    href: "https://r-evolution.com/",
    src: "/partners/hexagon.svg",
    alt: "Hexagon R-evolution",
    w: 300,
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
      <div className="container flex flex-col items-end md:flex-row md:items-start md:space-x-28">
        <div
          className={`flex w-full flex-col space-y-5 md:w-1/2 md:space-y-10 lg:space-y-44 ${isSectionInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-20" : "md:opacity-0"}`}
        >
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
              {t("landing-partners-note")}
            </h3>
            <h2 className="max-w-44 pb-6 text-2xl text-blue-400 md:max-w-[290px] lg:text-3xl xl:text-4xl">
              {t("landing-partners-title")}
            </h2>
            <div className="text-base font-normal text-blue-900 lg:text-lg">
              <ReactMarkdown>{t("landing-partners-description")}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div
          className={`mt-10 flex w-full flex-col space-y-4 md:mt-0 md:w-1/2 ${isSectionInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-right-20" : "opacity-0"}`}
        >
          <ul className="grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
            {PARTNERS.map((partner, index) => (
              <Partner {...partner} key={`partner-${index}`} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
