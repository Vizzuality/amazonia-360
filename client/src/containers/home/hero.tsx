import Image from "next/image";
import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="w-screen md:bg-blue-50 flex flex-col-reverse md:flex-row md:h-[calc(100svh_-_theme(space.20)_+_1px)]">
      <div className="container relative">
        <div className="md:px-10 py-12 bg-white/80 max-w-2xl md:absolute z-10 flex flex-col space-y-6 md:top-1/2 md:rounded md:-translate-y-1/2">
          <h2 className="text-blue-400 text-2xl lg:text-4xl">
            Understanding Amazonia like never before
          </h2>
          <p className="text-blue-900 text-base lg:text-lg font-normal">
            With <span className="font-bold">Amazonia360</span> get all the
            resources you need about one of the world&apos;s most diverse
            ecosystems. Amazonia360 is your gateway to understanding and help
            you achieving the greatest impact in this region.
          </p>
          <Link href="/report">
            <Button size="lg" className="flex space-x-2.5">
              <p>Explore report tool</p>
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
        className="md:object-cover w-full md:h-[calc(100svh_-_theme(space.20)_+_1px)] md:w-7/12 md:absolute md:right-0"
      />
    </section>
  );
}
