import Image from "next/image";
import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="flex w-full flex-col-reverse md:h-[calc(100svh_-_theme(space.20)_+_1px)] md:flex-row md:bg-blue-50">
      <div className="container relative">
        <div className="z-10 flex max-w-2xl flex-col space-y-6 bg-white/80 py-12 md:absolute md:top-1/2 md:-translate-y-1/2 md:rounded md:px-10">
          <h2 className="text-2xl text-blue-400 lg:text-4xl">
            Understanding Amazonia like never before
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            <span className="font-bold">Amazonia360+</span> is your gateway to understanding and
            achieving the greatest impact in this region.
          </p>
          <Link href="/report">
            <Button size="lg" className="flex space-x-2.5">
              <p>Access report tool</p>
              <LuArrowRight size={20} strokeWidth={1} />
            </Button>
          </Link>
        </div>
      </div>
      <Image
        src={"/images/home/hero.jpg"}
        alt="Amazonia"
        width={1500}
        height={1500}
        className="w-full md:absolute md:right-0 md:h-[calc(100svh_-_theme(space.20)_+_1px)] md:w-7/12 md:object-cover"
      />
    </section>
  );
}
