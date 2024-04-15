import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="w-screen bg-blue-50 flex h-[calc(100vh-5rem)]">
      <div className="container">
        <div className="px-10 py-12 bg-white/80 absolute max-w-2xl absolute z-10 flex flex-col space-y-6 rounded translate-y-1/2">
          <h2 className="text-blue-400 text-4xl">
            Understanding Amazonia like never before
          </h2>
          <p className="text-blue-900 text-lg font-light">
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
          className="object-cover h-[calc(100vh-5rem)] w-7/12 absolute right-0 top-20"
        />
      </div>
    </section>
  );
}
