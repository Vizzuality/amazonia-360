import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="w-screen md:bg-blue-50 flex md:h-[calc(100vh-5rem)]">
      <div className="md:container flex flex-col flex-reverse">
        <div className="px-10 py-12 bg-white/80 max-w-2xl md:absolute z-10 flex flex-col space-y-6 md:rounded md:translate-y-1/2">
          <h2 className="text-blue-400 text-2xl lg:text-4xl">
            Understanding Amazonia like never before
          </h2>
          <p className="text-blue-900 text-base lg:text-lg font-light">
            With <span className="font-bold">Amazonia360</span> get all the
            resources you need about one of the world&apos;s most diverse
            ecosystems. Amazonia360 is your gateway to understanding and help
            you achieving the greatest impact in this region.
          </p>
          <Link href="/report">
            <Button size="lg" className="flex space-x-2.5">
              <p>Explore report tool</p>
              <ArrowRight size={20} strokeWidth={1} />
            </Button>
          </Link>
        </div>
        <Image
          src={"/images/home/hero.jpg"}
          alt="Amazonia"
          width={500}
          height={500}
          className="md:object-cover w-full md:h-[calc(100vh-5rem)] md:w-7/12 md:absolute md:right-0 md:top-20"
        />
      </div>
    </section>
  );
}
