import Image from "next/image";
import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hub() {
  return (
    <main className="flex flex-col-reverse md:flex-row w-full bg-blue-50 md:h-[calc(100svh_-_theme(space.40)_+_1px)] relative">
      <div className="container flex h-full md:pr-60 py-12 md:py-0">
        <div className="w-full md:w-1/2 h-full flex flex-col justify-center p-10">
          <h2 className="text-blue-400 text-3xl lg:text-4xl pb-6 font-semibold">
            We are currently <br />
            building this feature!
          </h2>
          <div className="text-blue-900 text-base font-normal pb-12 flex flex-col space-y-2">
            <p>
              We&apos;re currently developing the Hub - your one-stop
              destination for accessing and sharing all essential information to{" "}
              <b>guide decision-making</b> in the Amazonia region. Here,
              <b>collaboration, coordination,</b> and <b>knowledge sharing</b>{" "}
              empower informed choices and drive <b>positive impact</b>.
            </p>
            <p>
              While we are working on this, we encourage you to explore our{" "}
              <b>Reporting tool</b>, offering valuable insights into the
              Amazonia.
            </p>
          </div>
          <Link href="/report">
            <Button size="lg" className="mt-4 space-x-2.5 flex">
              <p>Explore reporting tool</p>
              <LuArrowRight size={20} strokeWidth={1} />
            </Button>
          </Link>
        </div>
      </div>
      <div className="md:absolute md:right-0 md:top-0 md:w-1/2 md:h-full w-full">
        <Image
          src={"/images/hub/coming-soon.jpg"}
          alt="Coming soon..."
          width={2000}
          height={2000}
          priority
          className="object-cover h-full w-full"
        />
      </div>
    </main>
  );
}
