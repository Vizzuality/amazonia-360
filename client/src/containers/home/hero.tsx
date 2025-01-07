import Image from "next/image";
import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="flex w-full flex-col-reverse md:h-[calc(100svh_-_theme(space.20)_+_1px)] md:flex-row md:bg-blue-50">
      <div className="container relative">
        <div className="z-10 flex max-w-2xl flex-col space-y-6 py-12 md:absolute md:top-1/2 md:-translate-y-1/2 md:rounded md:px-10">
          <h2 className="text-2xl text-blue-400 lg:text-4xl">
            Understanding Amazonia like never before
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            With <span className="font-bold">AmazoniaForever360+</span> get all the resources you
            need about one of the world`&apos;`s most diverse ecosystems. AmazoniaForever360+ is
            your gateway to understanding and help you achieving the greatest impact in this region.
          </p>
          <div className="flex space-x-4 py-6">
            <Link href="/report" prefetch>
              <Button size="lg" className="flex space-x-2.5">
                <p>Access report tool</p>
                <LuArrowRight size={20} strokeWidth={1} />
              </Button>
            </Link>
            <Link href="/report" prefetch>
              <Button size="lg" className="flex space-x-2.5" variant="outline">
                <p>More info</p>
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
          className="bottom-0 w-full md:absolute md:right-0 md:top-[30%] md:w-6/12 md:object-cover"
        />
      </div>
    </section>
  );
}
